import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import {
  workshopContacts,
  workshopSessions,
  type WorkshopContact,
} from "@/db/schema";
import { OTHER_SEAT, getTeam, isTeamId, type TeamId } from "@/lib/workshop/config";
import { normaliseText } from "@/lib/workshop/normalise";
import { memberKey } from "@/lib/workshop/roster";

/**
 * The members' portal: a small CRM over one session's contacts.
 *
 * One shared password rather than an account each. These are chapter members
 * in a room together, not strangers, and a password everyone can be told from
 * the front is the difference between a tool people use and one they don't.
 */

/**
 * The session the portal works from: the most recent run that actually has
 * contacts, falling back to the live one.
 *
 * Not simply the live session. Ending a session leaves it live, so the usual
 * case is the same either way — but the moment Harry starts a new session the
 * live one is empty, and members would open the portal to a blank list with
 * the names they are meant to be inviting nowhere to be seen.
 */
export async function getPortalSessionId(liveSessionId: string): Promise<string> {
  const [row] = await db
    .select({ id: workshopSessions.id })
    .from(workshopSessions)
    .innerJoin(workshopContacts, eq(workshopContacts.sessionId, workshopSessions.id))
    .groupBy(workshopSessions.id, workshopSessions.createdAt)
    .orderBy(desc(workshopSessions.createdAt))
    .limit(1);

  return row?.id ?? liveSessionId;
}

/**
 * The session a portal link is asking for, or the default one.
 *
 * An unknown id falls back rather than erroring: these links get pasted into
 * the chapter WhatsApp group and will be opened months later, by which time a
 * truncated or mangled one should still land somewhere useful.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function resolvePortalSessionId(
  liveSessionId: string,
  requested: string | null,
): Promise<string> {
  // Checked before it reaches the query: the column is a uuid, so Postgres
  // raises on anything that isn't one, and a link mangled on its way through
  // WhatsApp would take the whole portal down rather than falling back.
  if (requested && UUID.test(requested)) {
    const [row] = await db
      .select({ id: workshopSessions.id })
      .from(workshopSessions)
      .where(eq(workshopSessions.id, requested))
      .limit(1);
    if (row) return row.id;
  }
  return getPortalSessionId(liveSessionId);
}

export async function getSessionPassword(sessionId: string): Promise<string | null> {
  const [row] = await db
    .select({ password: workshopSessions.portalPassword })
    .from(workshopSessions)
    .where(eq(workshopSessions.id, sessionId))
    .limit(1);
  return row?.password ?? null;
}

export type PortalSessionSummary = {
  id: string;
  createdAt: string;
  contacts: number;
  claimed: number;
  invited: number;
  isLive: boolean;
};

/**
 * Every run that has names in it, newest first.
 *
 * Only runs with contacts: an empty session is a portal with nothing in it,
 * and offering it in the switcher would only look broken.
 */
export async function listPortalSessions(): Promise<PortalSessionSummary[]> {
  const rows = await db
    .select({
      id: workshopSessions.id,
      createdAt: workshopSessions.createdAt,
      isLive: workshopSessions.isLive,
      contacts: sql<number>`count(${workshopContacts.id})::int`,
      claimed: sql<number>`count(${workshopContacts.claimedBy})::int`,
      invited: sql<number>`count(${workshopContacts.invitedAt})::int`,
    })
    .from(workshopSessions)
    .innerJoin(workshopContacts, eq(workshopContacts.sessionId, workshopSessions.id))
    .groupBy(workshopSessions.id, workshopSessions.createdAt, workshopSessions.isLive)
    .orderBy(desc(workshopSessions.createdAt));

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    isLive: row.isLive,
    contacts: row.contacts,
    claimed: row.claimed,
    invited: row.invited,
  }));
}

export function verifyPortalPassword(
  stored: string | null | undefined,
  given: string | null | undefined,
): boolean {
  if (!stored || !given) return false;
  const a = Buffer.from(stored.trim());
  const b = Buffer.from(given.trim());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type PortalContact = {
  id: string;
  contactName: string;
  company: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  notes: string | null;
  category: string;
  seat: string;
  seatTeam: TeamId | null;
  submitterName: string | null;
  claimedBy: string | null;
  claimedAt: string | null;
  invitedAt: string | null;
  round: number;
};

function toPortalContact(row: WorkshopContact): PortalContact {
  const team = isTeamId(row.seatTeam) ? row.seatTeam : null;
  return {
    id: row.id,
    contactName: row.contactName,
    company: row.company,
    phone: row.phone,
    email: row.email,
    website: row.website,
    notes: row.notes,
    category: row.category,
    seat:
      row.seatIndex === OTHER_SEAT
        ? row.category
        : (getTeam(row.seatTeam)?.seats[row.seatIndex] ?? row.category),
    seatTeam: team,
    submitterName: row.submitterName,
    claimedBy: row.claimedBy,
    claimedAt: row.claimedAt?.toISOString() ?? null,
    invitedAt: row.invitedAt?.toISOString() ?? null,
    round: row.round,
  };
}

export async function listPortalContacts(sessionId: string): Promise<PortalContact[]> {
  const rows = await db
    .select()
    .from(workshopContacts)
    .where(eq(workshopContacts.sessionId, sessionId))
    .orderBy(asc(workshopContacts.contactName));
  return rows.map(toPortalContact);
}

export type ClaimResult =
  | { ok: true; contact: PortalContact }
  | { ok: false; error: string };

/**
 * Takes a contact on, if nobody else has.
 *
 * The `claimed_by is null` guard is in the UPDATE rather than a read first:
 * two members tapping claim on the same person at the same moment is exactly
 * what this feature invites, and a read-then-write would let both through and
 * have them both go and invite the same person.
 */
export async function claimContact(
  sessionId: string,
  contactId: string,
  memberName: string,
): Promise<ClaimResult> {
  const name = memberName.trim();
  if (!name) return { ok: false, error: "Pick your name first." };

  const [row] = await db
    .update(workshopContacts)
    .set({
      claimedBy: name,
      claimedByKey: memberKey(name),
      claimedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workshopContacts.id, contactId),
        eq(workshopContacts.sessionId, sessionId),
        isNull(workshopContacts.claimedBy),
      ),
    )
    .returning();

  if (row) return { ok: true, contact: toPortalContact(row) };

  // Either it does not exist or somebody got there first; say which.
  const [existing] = await db
    .select()
    .from(workshopContacts)
    .where(
      and(eq(workshopContacts.id, contactId), eq(workshopContacts.sessionId, sessionId)),
    )
    .limit(1);

  if (!existing) return { ok: false, error: "That contact is no longer on the list." };
  if (existing.claimedBy && memberKey(existing.claimedBy) === memberKey(name)) {
    return { ok: true, contact: toPortalContact(existing) };
  }
  return {
    ok: false,
    error: `${existing.claimedBy} claimed ${existing.contactName} just before you.`,
  };
}

/** Puts a contact back, so somebody else can take it on. */
export async function releaseContact(
  sessionId: string,
  contactId: string,
  memberName: string,
): Promise<ClaimResult> {
  const [row] = await db
    .update(workshopContacts)
    .set({
      claimedBy: null,
      claimedByKey: null,
      claimedAt: null,
      invitedAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workshopContacts.id, contactId),
        eq(workshopContacts.sessionId, sessionId),
        eq(workshopContacts.claimedByKey, memberKey(memberName)),
      ),
    )
    .returning();

  if (!row) return { ok: false, error: "That isn't yours to release." };
  return { ok: true, contact: toPortalContact(row) };
}

export type ContactEdits = {
  company?: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
};

function tidy(value: string | undefined, max: number): string | null | undefined {
  if (value === undefined) return undefined;
  const cleaned = value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
  return cleaned === "" ? null : cleaned;
}

/** Normalises a typed website into something that will actually open. */
export function tidyWebsite(value: string | undefined): string | null | undefined {
  const cleaned = tidy(value, 200);
  if (cleaned === undefined || cleaned === null) return cleaned;
  const withScheme = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Corrects a contact's details. Only the member who claimed it may.
 *
 * Claiming is what makes someone accountable for the invitation, so it is also
 * what gives them the right to fix the record. An unclaimed contact stays as
 * the room submitted it.
 */
export async function updateContact(
  sessionId: string,
  contactId: string,
  memberName: string,
  edits: ContactEdits,
): Promise<ClaimResult> {
  const patch: Record<string, unknown> = { updatedAt: new Date() };

  const company = tidy(edits.company, 80);
  if (company !== undefined) {
    if (company === null) return { ok: false, error: "Company can't be empty." };
    patch.company = company;
    patch.companyKey = normaliseText(company);
  }
  const phone = tidy(edits.phone, 40);
  if (phone !== undefined) patch.phone = phone;
  const email = tidy(edits.email, 120);
  if (email !== undefined) patch.email = email;
  const notes = tidy(edits.notes, 500);
  if (notes !== undefined) patch.notes = notes;
  const website = tidyWebsite(edits.website);
  if (website !== undefined) patch.website = website;

  const [row] = await db
    .update(workshopContacts)
    .set(patch)
    .where(
      and(
        eq(workshopContacts.id, contactId),
        eq(workshopContacts.sessionId, sessionId),
        eq(workshopContacts.claimedByKey, memberKey(memberName)),
      ),
    )
    .returning();

  if (!row) return { ok: false, error: "Claim this contact before editing it." };
  return { ok: true, contact: toPortalContact(row) };
}

/** Marks that the invitation has actually gone out, or undoes that. */
export async function setInvited(
  sessionId: string,
  contactId: string,
  memberName: string,
  invited: boolean,
): Promise<ClaimResult> {
  const [row] = await db
    .update(workshopContacts)
    .set({ invitedAt: invited ? new Date() : null, updatedAt: new Date() })
    .where(
      and(
        eq(workshopContacts.id, contactId),
        eq(workshopContacts.sessionId, sessionId),
        eq(workshopContacts.claimedByKey, memberKey(memberName)),
      ),
    )
    .returning();

  if (!row) return { ok: false, error: "Claim this contact first." };
  return { ok: true, contact: toPortalContact(row) };
}

export type PortalStats = {
  total: number;
  claimed: number;
  invited: number;
  unclaimed: number;
  mine: number;
};

export async function getPortalStats(
  sessionId: string,
  memberName: string | null,
): Promise<PortalStats> {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      claimed: sql<number>`count(${workshopContacts.claimedBy})::int`,
      invited: sql<number>`count(${workshopContacts.invitedAt})::int`,
    })
    .from(workshopContacts)
    .where(eq(workshopContacts.sessionId, sessionId));

  let mine = 0;
  if (memberName) {
    const [row2] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(workshopContacts)
      .where(
        and(
          eq(workshopContacts.sessionId, sessionId),
          eq(workshopContacts.claimedByKey, memberKey(memberName)),
        ),
      );
    mine = row2?.n ?? 0;
  }

  const total = row?.total ?? 0;
  const claimed = row?.claimed ?? 0;
  return { total, claimed, invited: row?.invited ?? 0, unclaimed: total - claimed, mine };
}
