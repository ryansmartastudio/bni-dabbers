import { and, asc, desc, eq, isNotNull, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  crmNotes,
  crmVisitors,
  members,
  workshopContacts,
  workshopSessions,
  type CrmVisitor,
} from "@/db/schema";
import { emailKey, normaliseText, phoneKey } from "@/lib/workshop/normalise";
import { tidy, tidyWebsite } from "@/lib/workshop/portal";

/**
 * The pipeline.
 *
 * Every function here takes a chapterId and puts it in the WHERE clause. That
 * is not belt-and-braces: it is the only thing standing between one chapter
 * and another's visitors, and the chapter always comes from the signed-in
 * member (requireChapterMember), never from a request parameter.
 */

export const CRM_STAGES = [
  "to_invite",
  "invited",
  "visit_booked",
  "visited",
  "joined",
  "not_now",
] as const;

export type CrmStage = (typeof CRM_STAGES)[number];

export const STAGE_LABELS: Record<CrmStage, string> = {
  to_invite: "To invite",
  invited: "Invited",
  visit_booked: "Visit booked",
  visited: "Visited",
  joined: "Joined",
  not_now: "Not now",
};

/** The two columns that mean "finished with", so the board can de-emphasise them. */
export const CLOSED_STAGES: CrmStage[] = ["joined", "not_now"];

export function isCrmStage(value: unknown): value is CrmStage {
  return typeof value === "string" && (CRM_STAGES as readonly string[]).includes(value);
}

export type PipelineVisitor = {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  category: string | null;
  stage: CrmStage;
  ownerMemberId: string | null;
  ownerName: string | null;
  ownerClaimedAt: string | null;
  invitedAt: string | null;
  visitBookedFor: string | null;
  visitedAt: string | null;
  archivedAt: string | null;
  sourceWorkshopSessionId: string | null;
  sourceLabel: string | null;
  createdAt: string;
  noteCount: number;
};

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

/** A workshop is identified to members by its date, not its uuid. */
function sourceLabel(createdAt: Date | null): string | null {
  if (!createdAt) return null;
  return createdAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function listPipeline(
  chapterId: string,
  options: { archived?: boolean } = {},
): Promise<PipelineVisitor[]> {
  const rows = await db
    .select({
      visitor: crmVisitors,
      ownerFirst: members.firstName,
      ownerLast: members.lastName,
      sessionCreatedAt: workshopSessions.createdAt,
      // Table names are written out rather than interpolated: Drizzle renders
      // an interpolated column unqualified ("id"), and inside this subquery
      // that resolves to crm_notes.id, not crm_visitors.id -- a predicate that
      // is false for every row. Qualified text keeps the correlation honest.
      noteCount: sql<number>`(
        select count(*)::int from crm_notes
        where crm_notes.visitor_id = crm_visitors.id
          and crm_notes.kind = 'note'
      )`,
    })
    .from(crmVisitors)
    .leftJoin(members, eq(members.id, crmVisitors.ownerMemberId))
    .leftJoin(
      workshopSessions,
      eq(workshopSessions.id, crmVisitors.sourceWorkshopSessionId),
    )
    .where(
      and(
        eq(crmVisitors.chapterId, chapterId),
        options.archived
          ? isNotNull(crmVisitors.archivedAt)
          : isNull(crmVisitors.archivedAt),
      ),
    )
    .orderBy(
      options.archived ? desc(crmVisitors.archivedAt) : asc(crmVisitors.name),
    );

  return rows.map(({ visitor, ownerFirst, ownerLast, sessionCreatedAt, noteCount }) => ({
    id: visitor.id,
    name: visitor.name,
    company: visitor.company,
    phone: visitor.phone,
    email: visitor.email,
    website: visitor.website,
    category: visitor.category,
    stage: visitor.stage as CrmStage,
    ownerMemberId: visitor.ownerMemberId,
    ownerName: ownerFirst ? `${ownerFirst} ${ownerLast ?? ""}`.trim() : null,
    ownerClaimedAt: iso(visitor.ownerClaimedAt),
    invitedAt: iso(visitor.invitedAt),
    visitBookedFor: visitor.visitBookedFor ?? null,
    visitedAt: iso(visitor.visitedAt),
    sourceWorkshopSessionId: visitor.sourceWorkshopSessionId,
    sourceLabel: sourceLabel(sessionCreatedAt ?? null),
    createdAt: visitor.createdAt.toISOString(),
    archivedAt: iso(visitor.archivedAt),
    noteCount,
  }));
}

export type PipelineCounts = {
  archived: number;
  all: number;
  mine: number;
  unclaimed: number;
  /** Claimed over a week ago and still not invited -- the reminder's quarry. */
  needsChasing: number;
};

/**
 * The numbers the sidebar carries.
 *
 * A separate aggregate rather than counting listPipeline's rows, so the shell
 * does not have to load every visitor on a page that may not show them.
 */
export async function countPipeline(
  chapterId: string,
  memberId: string,
): Promise<PipelineCounts> {
  const [row] = await db
    .select({
      all: sql<number>`count(*)::int`,
      mine: sql<number>`count(*) filter (where ${crmVisitors.ownerMemberId} = ${memberId})::int`,
      unclaimed: sql<number>`count(*) filter (where ${crmVisitors.ownerMemberId} is null)::int`,
      needsChasing: sql<number>`count(*) filter (
        where ${crmVisitors.ownerMemberId} is not null
          and ${crmVisitors.stage} = 'to_invite'
          and ${crmVisitors.ownerClaimedAt} < now() - interval '7 days'
      )::int`,
    })
    .from(crmVisitors)
    // Archived people are out of the pipeline, so they are out of every
    // figure the sidebar shows except their own.
    .where(
      and(eq(crmVisitors.chapterId, chapterId), isNull(crmVisitors.archivedAt)),
    );

  const [archivedRow] = await db
    .select({ archived: sql<number>`count(*)::int` })
    .from(crmVisitors)
    .where(
      and(
        eq(crmVisitors.chapterId, chapterId),
        isNotNull(crmVisitors.archivedAt),
      ),
    );

  return {
    archived: archivedRow?.archived ?? 0,
    all: row?.all ?? 0,
    mine: row?.mine ?? 0,
    unclaimed: row?.unclaimed ?? 0,
    needsChasing: row?.needsChasing ?? 0,
  };
}

export async function getVisitor(
  chapterId: string,
  visitorId: string,
): Promise<CrmVisitor | null> {
  const row = await db.query.crmVisitors.findFirst({
    where: and(eq(crmVisitors.id, visitorId), eq(crmVisitors.chapterId, chapterId)),
  });
  return row ?? null;
}

export type TimelineEntry = {
  id: string;
  kind: string;
  body: string;
  authorName: string | null;
  createdAt: string;
};

export async function listTimeline(
  chapterId: string,
  visitorId: string,
): Promise<TimelineEntry[]> {
  const rows = await db
    .select({
      id: crmNotes.id,
      kind: crmNotes.kind,
      body: crmNotes.body,
      first: members.firstName,
      last: members.lastName,
      createdAt: crmNotes.createdAt,
    })
    .from(crmNotes)
    .leftJoin(members, eq(members.id, crmNotes.authorMemberId))
    .where(and(eq(crmNotes.visitorId, visitorId), eq(crmNotes.chapterId, chapterId)))
    .orderBy(desc(crmNotes.createdAt));

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    body: row.body,
    authorName: row.first ? `${row.first} ${row.last ?? ""}`.trim() : null,
    createdAt: row.createdAt.toISOString(),
  }));
}

/**
 * Write to the timeline.
 *
 * Called for what people type AND for what the system does, so a visitor's
 * page tells one story. The portal has no history at all today — releasing a
 * contact there destroys the fact that anyone ever claimed or invited them.
 */
export async function addTimelineEntry(input: {
  chapterId: string;
  visitorId: string;
  authorMemberId: string | null;
  kind: "note" | "stage_change" | "claim" | "release" | "reminder_sent" | "reminder_answered" | "system";
  body: string;
}): Promise<void> {
  await db.insert(crmNotes).values({
    chapterId: input.chapterId,
    visitorId: input.visitorId,
    authorMemberId: input.authorMemberId,
    kind: input.kind,
    body: input.body,
  });
}

/** The timestamp a stage implies, so the board and the dates never disagree. */
function stampsForStage(stage: CrmStage, now: Date) {
  return {
    invitedAt: ["invited", "visit_booked", "visited", "joined"].includes(stage)
      ? now
      : null,
    visitedAt: ["visited", "joined"].includes(stage) ? now : null,
    closedAt: CLOSED_STAGES.includes(stage) ? now : null,
  };
}

export type CrmResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function setStage(
  chapterId: string,
  visitorId: string,
  actingMemberId: string,
  stage: CrmStage,
): Promise<CrmResult<CrmVisitor>> {
  const existing = await getVisitor(chapterId, visitorId);
  if (!existing) return { ok: false, error: "That visitor is no longer on the list." };

  // Claiming makes you accountable, so it makes you the editor. Notes stay
  // open to everyone; the stage does not.
  if (existing.ownerMemberId && existing.ownerMemberId !== actingMemberId) {
    return { ok: false, error: "Only the member who claimed them can move them." };
  }
  if (existing.stage === stage) return { ok: true, data: existing };

  const now = new Date();
  const stamps = stampsForStage(stage, now);

  const [updated] = await db
    .update(crmVisitors)
    .set({
      stage,
      // Keep an existing invited date rather than resetting it to now, so
      // moving Invited -> Visit booked does not rewrite when they were asked.
      invitedAt: stamps.invitedAt ? (existing.invitedAt ?? now) : null,
      visitedAt: stamps.visitedAt ? (existing.visitedAt ?? now) : null,
      closedAt: stamps.closedAt ? (existing.closedAt ?? now) : null,
      updatedAt: now,
    })
    .where(and(eq(crmVisitors.id, visitorId), eq(crmVisitors.chapterId, chapterId)))
    .returning();

  if (!updated) return { ok: false, error: "Couldn't move them. Try again." };

  await addTimelineEntry({
    chapterId,
    visitorId,
    authorMemberId: actingMemberId,
    kind: "stage_change",
    body: `Moved from ${STAGE_LABELS[existing.stage as CrmStage]} to ${STAGE_LABELS[stage]}`,
  });

  return { ok: true, data: updated };
}

export async function claimVisitor(
  chapterId: string,
  visitorId: string,
  memberId: string,
  memberName: string,
): Promise<CrmResult<CrmVisitor>> {
  const now = new Date();

  // One conditional update rather than read-then-write, so two members
  // tapping Claim at the same moment cannot both win.
  const [claimed] = await db
    .update(crmVisitors)
    .set({ ownerMemberId: memberId, ownerClaimedAt: now, updatedAt: now })
    .where(
      and(
        eq(crmVisitors.id, visitorId),
        eq(crmVisitors.chapterId, chapterId),
        or(isNull(crmVisitors.ownerMemberId), eq(crmVisitors.ownerMemberId, memberId)),
      ),
    )
    .returning();

  if (!claimed) {
    const existing = await getVisitor(chapterId, visitorId);
    if (!existing) return { ok: false, error: "That visitor is no longer on the list." };
    return { ok: false, error: "Somebody claimed them just before you." };
  }

  await addTimelineEntry({
    chapterId,
    visitorId,
    authorMemberId: memberId,
    kind: "claim",
    body: `${memberName} took this one on`,
  });

  return { ok: true, data: claimed };
}

export async function releaseVisitor(
  chapterId: string,
  visitorId: string,
  memberId: string,
  memberName: string,
): Promise<CrmResult<CrmVisitor>> {
  const now = new Date();

  const [released] = await db
    .update(crmVisitors)
    .set({
      ownerMemberId: null,
      ownerClaimedAt: null,
      // Back to the top of the pipeline for whoever picks them up, but the
      // timeline keeps what happened. Unlike the portal, nothing is erased.
      stage: "to_invite",
      invitedAt: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(crmVisitors.id, visitorId),
        eq(crmVisitors.chapterId, chapterId),
        eq(crmVisitors.ownerMemberId, memberId),
      ),
    )
    .returning();

  if (!released) return { ok: false, error: "That isn't yours to release." };

  await addTimelineEntry({
    chapterId,
    visitorId,
    authorMemberId: memberId,
    kind: "release",
    body: `${memberName} released this one back to the pool`,
  });

  return { ok: true, data: released };
}

export type VisitorEdits = {
  name?: string;
  company?: string;
  category?: string;
  phone?: string;
  email?: string;
  website?: string;
  /** yyyy-mm-dd, or empty to clear it. */
  visitBookedFor?: string;
};

const EDIT_LABELS: Record<keyof VisitorEdits, string> = {
  name: "Name",
  company: "Company",
  category: "What they do",
  phone: "Phone",
  email: "Email",
  website: "Website",
  visitBookedFor: "Visit booked for",
};

function shorten(value: string): string {
  return value.length > 48 ? `${value.slice(0, 47)}…` : value;
}

/** One readable line per change, so the timeline says what actually moved. */
function describeChange(label: string, before: string | null, after: string | null): string {
  if (before && after) return `${label} "${shorten(before)}" → "${shorten(after)}"`;
  if (after) return `${label} set to "${shorten(after)}"`;
  return `${label} cleared (was "${shorten(before ?? "")}")`;
}

/**
 * Correct a visitor's details.
 *
 * Open to any member of the chapter, unlike the stage. A wrong phone number
 * is a fact about a person rather than a claim on them, and making the
 * correction wait on whoever took them on is how a pipeline fills up with
 * numbers nobody can ring. Every change is written to the timeline with the
 * old value, so "open" does not mean "untraceable".
 */
export async function updateVisitorDetails(
  chapterId: string,
  visitorId: string,
  actingMemberId: string,
  actingMemberName: string,
  edits: VisitorEdits,
): Promise<CrmResult<CrmVisitor>> {
  const existing = await getVisitor(chapterId, visitorId);
  if (!existing) return { ok: false, error: "That visitor is no longer on the list." };

  const name = tidy(edits.name, 120);
  if (edits.name !== undefined && !name) {
    return { ok: false, error: "A visitor needs a name." };
  }

  const patch: Record<string, unknown> = {};
  const changes: string[] = [];

  const apply = (
    field: keyof VisitorEdits,
    column: string,
    next: string | null | undefined,
    before: string | null,
  ) => {
    if (next === undefined || next === before) return;
    patch[column] = next;
    changes.push(describeChange(EDIT_LABELS[field], before, next));
  };

  apply("name", "name", name, existing.name);
  apply("company", "company", tidy(edits.company, 80), existing.company);
  apply("category", "category", tidy(edits.category, 80), existing.category);
  apply("phone", "phone", tidy(edits.phone, 40), existing.phone);
  apply("email", "email", tidy(edits.email, 120), existing.email);
  apply("website", "website", tidyWebsite(edits.website), existing.website);

  if (edits.visitBookedFor !== undefined) {
    // A date column, so an empty string has to become null rather than "".
    const raw = edits.visitBookedFor.trim();
    const next = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
    if (raw && !next) return { ok: false, error: "That date didn't look right." };
    apply("visitBookedFor", "visitBookedFor", next, existing.visitBookedFor ?? null);
  }

  if (changes.length === 0) return { ok: true, data: existing };

  // The keys back the duplicate warning, so they are recomputed whenever the
  // field behind them moves -- otherwise the warning quietly stops matching.
  if ("name" in patch) patch.nameKey = normaliseText(patch.name as string);
  if ("company" in patch) patch.companyKey = normaliseText((patch.company as string) ?? "");
  if ("phone" in patch) patch.phoneKey = phoneKey(patch.phone as string | null);
  if ("email" in patch) patch.emailKey = emailKey(patch.email as string | null);
  patch.updatedAt = new Date();

  const [updated] = await db
    .update(crmVisitors)
    .set(patch)
    .where(and(eq(crmVisitors.id, visitorId), eq(crmVisitors.chapterId, chapterId)))
    .returning();

  if (!updated) return { ok: false, error: "Couldn't save that. Try again." };

  await addTimelineEntry({
    chapterId,
    visitorId,
    authorMemberId: actingMemberId,
    kind: "system",
    body: `${actingMemberName} updated the details — ${changes.join("; ")}`,
  });

  return { ok: true, data: updated };
}

export type DuplicateMatch = {
  /** Archived matches are still shown -- see findPossibleDuplicates. */
  archived: boolean;
  id: string;
  name: string;
  company: string | null;
  stage: CrmStage;
  sourceLabel: string | null;
};

/**
 * Anyone already in the pipeline who looks like this person.
 *
 * Advisory by design. The same person met at two workshops is two records
 * sharing no history, so this warns rather than refuses — a hard block would
 * stop a member adding a genuinely different Jane Smith.
 *
 * Archived records are deliberately still matched. Somebody archived because
 * they said no is precisely who a member should be warned about before
 * inviting them again; hiding them would make the archive a way to lose that.
 */
export async function findPossibleDuplicates(
  chapterId: string,
  input: {
    name: string;
    company?: string | null;
    phone?: string | null;
    email?: string | null;
    /** Set when asking on behalf of an existing record, so it skips itself. */
    excludeId?: string;
  },
): Promise<DuplicateMatch[]> {
  const nKey = normaliseText(input.name);
  const pKey = phoneKey(input.phone);
  const eKey = emailKey(input.email);
  if (!nKey && !pKey && !eKey) return [];

  const clauses = [
    nKey ? eq(crmVisitors.nameKey, nKey) : null,
    pKey ? eq(crmVisitors.phoneKey, pKey) : null,
    eKey ? eq(crmVisitors.emailKey, eKey) : null,
  ].filter((clause): clause is NonNullable<typeof clause> => clause !== null);

  const rows = await db
    .select({
      id: crmVisitors.id,
      name: crmVisitors.name,
      company: crmVisitors.company,
      stage: crmVisitors.stage,
      archivedAt: crmVisitors.archivedAt,
      sessionCreatedAt: workshopSessions.createdAt,
    })
    .from(crmVisitors)
    .leftJoin(
      workshopSessions,
      eq(workshopSessions.id, crmVisitors.sourceWorkshopSessionId),
    )
    .where(
      and(
        eq(crmVisitors.chapterId, chapterId),
        input.excludeId ? ne(crmVisitors.id, input.excludeId) : undefined,
        or(...clauses),
      ),
    )
    // Live matches first: an active record is the more urgent clash. Plain
    // asc() would do the opposite -- Postgres sorts NULLs last on ascending,
    // and a live row is the one with a NULL archived_at. Written out and
    // qualified, because an interpolated column renders unqualified.
    .orderBy(sql`crm_visitors.archived_at asc nulls first`)
    .limit(5);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    company: row.company,
    stage: row.stage as CrmStage,
    archived: row.archivedAt !== null,
    sourceLabel: sourceLabel(row.sessionCreatedAt ?? null),
  }));
}

export type PromotionSummary = { added: number; skipped: number };

/**
 * Copy a finished workshop's contacts into the pipeline.
 *
 * Idempotent on source_workshop_contact_id, so running it again after a late
 * addition picks up only what is new. The room's own record in
 * workshop_contacts is never modified.
 */
export async function promoteWorkshopSession(
  chapterId: string,
  sessionId: string,
): Promise<PromotionSummary> {
  const session = await db.query.workshopSessions.findFirst({
    where: and(
      eq(workshopSessions.id, sessionId),
      eq(workshopSessions.chapterId, chapterId),
    ),
  });
  if (!session) return { added: 0, skipped: 0 };

  const contacts = await db
    .select()
    .from(workshopContacts)
    .where(eq(workshopContacts.sessionId, sessionId));

  if (contacts.length === 0) return { added: 0, skipped: 0 };

  // The portal recorded owners as a name string. Resolve those to member rows
  // here; anything that does not match arrives unclaimed rather than wrong.
  const roster = await db
    .select({ id: members.id, first: members.firstName, last: members.lastName })
    .from(members)
    .where(eq(members.chapterId, chapterId));
  const byKey = new Map(
    roster.map((m) => [normaliseText(`${m.first} ${m.last}`), m.id] as const),
  );

  const rows = contacts.map((contact) => {
    const ownerId = contact.claimedByKey
      ? (byKey.get(contact.claimedByKey) ?? null)
      : null;
    return {
      chapterId,
      sourceWorkshopSessionId: sessionId,
      sourceWorkshopContactId: contact.id,
      stage: (contact.invitedAt ? "invited" : "to_invite") as CrmStage,
      name: contact.contactName,
      company: contact.company || null,
      phone: contact.phone,
      email: contact.email,
      website: contact.website,
      category: contact.category,
      ownerMemberId: ownerId,
      ownerClaimedAt: ownerId ? contact.claimedAt : null,
      invitedAt: ownerId ? contact.invitedAt : null,
      nameKey: contact.nameKey,
      companyKey: contact.companyKey,
      phoneKey: contact.phoneKey,
      emailKey: contact.emailKey,
    };
  });

  const inserted = await db
    .insert(crmVisitors)
    .values(rows)
    // crm_visitors_source_contact_idx is a PARTIAL unique index, and Postgres
    // will only infer a partial index when the statement repeats its predicate
    // -- without targetWhere this fails outright with 42P10.
    .onConflictDoNothing({
      target: crmVisitors.sourceWorkshopContactId,
      where: sql`${crmVisitors.sourceWorkshopContactId} is not null`,
    })
    .returning({ id: crmVisitors.id, name: crmVisitors.name });

  // The notes the room wrote are the first entry on each timeline rather than
  // a column, so they read as part of the story.
  const noteRows = contacts
    .filter((contact) => contact.notes?.trim())
    .map((contact) => ({ contactId: contact.id, body: contact.notes!.trim() }));

  if (noteRows.length > 0 && inserted.length > 0) {
    const promoted = await db
      .select({ id: crmVisitors.id, source: crmVisitors.sourceWorkshopContactId })
      .from(crmVisitors)
      .where(eq(crmVisitors.sourceWorkshopSessionId, sessionId));
    const idBySource = new Map(promoted.map((p) => [p.source, p.id] as const));

    const toInsert = noteRows
      .map((note) => {
        const visitorId = idBySource.get(note.contactId);
        if (!visitorId) return null;
        return {
          chapterId,
          visitorId,
          authorMemberId: null,
          kind: "system" as const,
          body: `From the workshop: ${note.body}`,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (toInsert.length > 0) await db.insert(crmNotes).values(toInsert);
  }

  return { added: inserted.length, skipped: contacts.length - inserted.length };
}

/**
 * Take somebody out of the pipeline without destroying what happened.
 *
 * The reversible option, and the one the UI pushes. The record keeps its
 * timeline, so "we archived them in March because they'd joined another
 * chapter" is still answerable a year later. Archived people are invisible
 * to the board, the counts, the reports and the reminder cron, but they
 * still raise a duplicate warning, which is the point: archiving should not
 * be a way to forget that somebody already said no.
 */
export async function archiveVisitor(
  chapterId: string,
  visitorId: string,
  actingMemberId: string,
  actingMemberName: string,
  reason?: string,
): Promise<CrmResult<CrmVisitor>> {
  const existing = await getVisitor(chapterId, visitorId);
  if (!existing) return { ok: false, error: "Couldn't find them." };
  if (existing.archivedAt) return { ok: true, data: existing };

  const [updated] = await db
    .update(crmVisitors)
    .set({
      archivedAt: new Date(),
      archivedByMemberId: actingMemberId,
      // Archiving releases them. Leaving a claim on an archived record means
      // it still counts against the member who took them on, in a list they
      // can no longer see.
      ownerMemberId: null,
      ownerClaimedAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(crmVisitors.id, visitorId),
        eq(crmVisitors.chapterId, chapterId),
        isNull(crmVisitors.archivedAt),
      ),
    )
    .returning();

  if (!updated) return { ok: false, error: "Couldn't archive them. Try again." };

  const note = reason?.trim();
  await addTimelineEntry({
    chapterId,
    visitorId,
    authorMemberId: actingMemberId,
    kind: "system",
    body: note
      ? `${actingMemberName} archived them: ${note}`
      : `${actingMemberName} archived them.`,
  });

  return { ok: true, data: updated };
}

/** Back into the pipeline, unclaimed, with the archiving still on record. */
export async function restoreVisitor(
  chapterId: string,
  visitorId: string,
  actingMemberId: string,
  actingMemberName: string,
): Promise<CrmResult<CrmVisitor>> {
  const [updated] = await db
    .update(crmVisitors)
    .set({ archivedAt: null, archivedByMemberId: null, updatedAt: new Date() })
    .where(
      and(
        eq(crmVisitors.id, visitorId),
        eq(crmVisitors.chapterId, chapterId),
        isNotNull(crmVisitors.archivedAt),
      ),
    )
    .returning();

  if (!updated) return { ok: false, error: "They aren't in the archive." };

  await addTimelineEntry({
    chapterId,
    visitorId,
    authorMemberId: actingMemberId,
    kind: "system",
    body: `${actingMemberName} restored them to the pipeline.`,
  });

  return { ok: true, data: updated };
}

export type DeletedVisitor = { id: string; name: string };

/**
 * Gone. Not archived -- gone, with the timeline and reminders it carried.
 *
 * Admin-only and deliberately awkward to reach, because this is the only
 * operation in the CRM that destroys the record of what happened. It exists
 * because "take my details off your system" is a request a chapter has to be
 * able to honour, and an archive that still holds a phone number does not
 * honour it.
 *
 * crm_notes and crm_reminders cascade from crm_visitors, so one delete takes
 * the lot. Nothing is written to a timeline afterwards: there is nothing left
 * to write it against.
 */
export async function deleteVisitor(
  chapterId: string,
  visitorId: string,
): Promise<CrmResult<DeletedVisitor>> {
  const [deleted] = await db
    .delete(crmVisitors)
    .where(and(eq(crmVisitors.id, visitorId), eq(crmVisitors.chapterId, chapterId)))
    .returning({ id: crmVisitors.id, name: crmVisitors.name });

  if (!deleted) return { ok: false, error: "Couldn't find them." };
  return { ok: true, data: deleted };
}
