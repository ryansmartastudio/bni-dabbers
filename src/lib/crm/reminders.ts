import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { crmReminders, crmVisitors, members } from "@/db/schema";
import { addTimelineEntry, releaseVisitor, setStage } from "@/lib/crm/visitors";
import { createReminderToken, hashToken, looksLikeToken } from "@/lib/crm/tokens";

/**
 * The nudge.
 *
 * Taking a visitor on is a promise, and the pipeline is only honest if that
 * promise is followed up. The 19 November workshop produced 107 names and not
 * one claim through the portal, which is the whole case for this file.
 */

/** Grace before the first nudge, and the gap between them. */
export const REMINDER_GAP_DAYS = 7;

/** Four nudges and then silence. The cap is what keeps this out of spam. */
export const MAX_ATTEMPTS = 4;

export type DueReminder = {
  visitorId: string;
  visitorName: string;
  visitorCompany: string | null;
  chapterId: string;
  memberId: string;
  memberFirstName: string;
  memberEmail: string;
  /** Which nudge this will be, 1-4. */
  attempt: number;
  /** What made it due, for the dry run to print. */
  reason: string;
};

type DueRow = {
  visitor_id: string;
  visitor_name: string;
  visitor_company: string | null;
  chapter_id: string;
  member_id: string;
  first_name: string;
  email: string;
  owner_claimed_at: string | null;
  attempts: number;
  last_sent: string | null;
};

function days(n: number): number {
  return n * 86_400_000;
}

/**
 * Who is overdue a nudge.
 *
 * Answering "yes" moves the visitor out of to_invite, so an answered
 * reminder drops out of this query by itself -- there is no answered flag to
 * keep in step. Answering "no" leaves them here, which is deliberate: "not
 * yet" is not "stop asking", and the attempt cap is what ends the sequence.
 */
export async function findDueReminders(now = new Date()): Promise<DueReminder[]> {
  const result = await db.execute(sql`
    select
      v.id              as visitor_id,
      v.name            as visitor_name,
      v.company         as visitor_company,
      v.chapter_id      as chapter_id,
      m.id              as member_id,
      m.first_name      as first_name,
      m.email           as email,
      v.owner_claimed_at as owner_claimed_at,
      (
        select count(*)::int from crm_reminders r
        where r.visitor_id = v.id and r.member_id = m.id and r.sent_at is not null
      ) as attempts,
      (
        select max(r.sent_at) from crm_reminders r
        where r.visitor_id = v.id and r.member_id = m.id and r.sent_at is not null
      ) as last_sent
    from crm_visitors v
    join members m on m.id = v.owner_member_id
    where v.stage = 'to_invite'
      and m.status = 'active'
      and m.email <> ''
    order by v.owner_claimed_at asc nulls last
  `);

  const rows = (result.rows ?? result) as unknown as DueRow[];
  const cutoff = now.getTime() - days(REMINDER_GAP_DAYS);

  const due: DueReminder[] = [];
  for (const row of rows) {
    if (row.attempts >= MAX_ATTEMPTS) continue;

    // The clock starts at the claim for the first nudge and at the last one
    // sent after that, so a sequence stays weekly however late the cron runs.
    const since = row.last_sent ?? row.owner_claimed_at;
    if (!since) continue;
    const sinceMs = new Date(since).getTime();
    if (sinceMs > cutoff) continue;

    const waited = Math.floor((now.getTime() - sinceMs) / days(1));
    due.push({
      visitorId: row.visitor_id,
      visitorName: row.visitor_name,
      visitorCompany: row.visitor_company,
      chapterId: row.chapter_id,
      memberId: row.member_id,
      memberFirstName: row.first_name,
      memberEmail: row.email,
      attempt: row.attempts + 1,
      reason: row.last_sent
        ? `last nudge ${waited} days ago`
        : `claimed ${waited} days ago, never nudged`,
    });
  }

  return due;
}

/**
 * Create the row, send, then stamp sentAt.
 *
 * That order is the enquiries pattern: a crash between the send and the stamp
 * leaves a row that looks unsent, and the attempt counter only counts stamped
 * rows, so the worst case is one repeat rather than a silent gap.
 */
export async function recordReminder(due: DueReminder, now = new Date()) {
  const { token, tokenHash, expiresAt } = createReminderToken(now);

  const [row] = await db
    .insert(crmReminders)
    .values({
      chapterId: due.chapterId,
      visitorId: due.visitorId,
      memberId: due.memberId,
      attempt: due.attempt,
      dueAt: now,
      tokenHash,
      tokenExpiresAt: expiresAt,
    })
    .returning({ id: crmReminders.id });

  if (!row) throw new Error("Could not record the reminder.");
  return { reminderId: row.id, token };
}

export async function markReminderSent(
  reminderId: string,
  due: DueReminder,
  now = new Date(),
) {
  await db
    .update(crmReminders)
    .set({ sentAt: now })
    .where(eq(crmReminders.id, reminderId));

  await addTimelineEntry({
    chapterId: due.chapterId,
    visitorId: due.visitorId,
    authorMemberId: null,
    kind: "reminder_sent",
    body:
      due.attempt >= MAX_ATTEMPTS
        ? `Last reminder sent to ${due.memberFirstName} (${due.attempt} of ${MAX_ATTEMPTS})`
        : `Reminder ${due.attempt} of ${MAX_ATTEMPTS} sent to ${due.memberFirstName}`,
  });
}

export type ResolvedReminder = {
  reminderId: string;
  chapterId: string;
  visitorId: string;
  visitorName: string;
  visitorCompany: string | null;
  memberId: string;
  memberName: string;
  alreadyAnswered: "yes" | "no" | null;
  stillOwned: boolean;
};

/**
 * Turn a link back into a reminder.
 *
 * Looked up by hash, never by the raw value, and expiry is checked here so no
 * page has to remember to.
 */
export async function resolveReminderToken(
  token: string,
): Promise<ResolvedReminder | null> {
  if (!looksLikeToken(token)) return null;

  const [row] = await db
    .select({
      reminderId: crmReminders.id,
      chapterId: crmReminders.chapterId,
      visitorId: crmReminders.visitorId,
      memberId: crmReminders.memberId,
      answer: crmReminders.answer,
      expiresAt: crmReminders.tokenExpiresAt,
      visitorName: crmVisitors.name,
      visitorCompany: crmVisitors.company,
      ownerMemberId: crmVisitors.ownerMemberId,
      first: members.firstName,
      last: members.lastName,
    })
    .from(crmReminders)
    .innerJoin(crmVisitors, eq(crmVisitors.id, crmReminders.visitorId))
    .innerJoin(members, eq(members.id, crmReminders.memberId))
    .where(eq(crmReminders.tokenHash, hashToken(token)))
    .limit(1);

  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;

  return {
    reminderId: row.reminderId,
    chapterId: row.chapterId,
    visitorId: row.visitorId,
    visitorName: row.visitorName,
    visitorCompany: row.visitorCompany,
    memberId: row.memberId,
    memberName: `${row.first} ${row.last ?? ""}`.trim(),
    alreadyAnswered: row.answer as "yes" | "no" | null,
    stillOwned: row.ownerMemberId === row.memberId,
  };
}

/**
 * Record an answer.
 *
 * Conditional on the answer still being null, so a mail client that prefetches
 * the link and then the member clicking it only writes one timeline entry.
 */
async function stampAnswer(
  reminder: ResolvedReminder,
  answer: "yes" | "no",
  now: Date,
): Promise<boolean> {
  const [stamped] = await db
    .update(crmReminders)
    .set({ answer, answeredAt: now })
    .where(
      and(eq(crmReminders.id, reminder.reminderId), isNull(crmReminders.answer)),
    )
    .returning({ id: crmReminders.id });

  return Boolean(stamped);
}

/**
 * "Yes, I've invited them", applied by the page the link lands on.
 *
 * That page writes as it renders, and a server action anywhere on it makes
 * the router render it again -- so this has to be safe to call repeatedly,
 * and it must not undo an undo. A "no" on the record is the stop sign: it is
 * set by pressing Not yet and by pressing Undo, and it means this link has
 * had its say. setStage is itself a no-op on an unchanged stage, so the
 * ordinary repeat writes nothing either.
 */
export async function answerYes(reminder: ResolvedReminder, now = new Date()) {
  if (reminder.alreadyAnswered === "no") {
    return { ok: false as const, error: "That reminder was already answered." };
  }

  const first = await stampAnswer(reminder, "yes", now);
  const result = await setStage(
    reminder.chapterId,
    reminder.visitorId,
    reminder.memberId,
    "invited",
  );

  if (first) {
    await addTimelineEntry({
      chapterId: reminder.chapterId,
      visitorId: reminder.visitorId,
      authorMemberId: reminder.memberId,
      kind: "reminder_answered",
      body: `${reminder.memberName} confirmed the invite from a reminder`,
    });
  }

  return result;
}

/**
 * "Actually, I've just sent it" -- the button on the Not yet page.
 *
 * Overwrites a "no", which is the one correction the links cannot otherwise
 * make: once a reminder is answered, the yes link from that same email is
 * spent, and waiting a week to record a sent invite would be daft.
 */
export async function markInvitedFromReminder(
  reminder: ResolvedReminder,
  now = new Date(),
) {
  await db
    .update(crmReminders)
    .set({ answer: "yes", answeredAt: now })
    .where(eq(crmReminders.id, reminder.reminderId));

  const result = await setStage(
    reminder.chapterId,
    reminder.visitorId,
    reminder.memberId,
    "invited",
  );
  if (!result.ok) return result;

  await addTimelineEntry({
    chapterId: reminder.chapterId,
    visitorId: reminder.visitorId,
    authorMemberId: reminder.memberId,
    kind: "reminder_answered",
    body: `${reminder.memberName} invited them after the reminder`,
  });

  return result;
}

export async function answerNo(reminder: ResolvedReminder, now = new Date()) {
  const first = await stampAnswer(reminder, "no", now);
  if (first) {
    await addTimelineEntry({
      chapterId: reminder.chapterId,
      visitorId: reminder.visitorId,
      authorMemberId: reminder.memberId,
      kind: "reminder_answered",
      body: `${reminder.memberName} hasn't invited them yet`,
    });
  }
}

/** The escape hatch on the "not yet" page: hand them back to the chapter. */
export async function releaseFromReminder(reminder: ResolvedReminder) {
  return releaseVisitor(
    reminder.chapterId,
    reminder.visitorId,
    reminder.memberId,
    reminder.memberName,
  );
}

/**
 * Undo for a mis-click, offered on the "yes" page.
 *
 * Records "no" rather than clearing the answer. Clearing it would re-arm the
 * page that is about to render again, which would silently re-mark them
 * invited -- the undo would look like it had failed, because it had.
 */
export async function undoYes(reminder: ResolvedReminder, now = new Date()) {
  await db
    .update(crmReminders)
    .set({ answer: "no", answeredAt: now })
    .where(eq(crmReminders.id, reminder.reminderId));

  const result = await setStage(
    reminder.chapterId,
    reminder.visitorId,
    reminder.memberId,
    "to_invite",
  );
  if (!result.ok) return result;

  await addTimelineEntry({
    chapterId: reminder.chapterId,
    visitorId: reminder.visitorId,
    authorMemberId: reminder.memberId,
    kind: "reminder_answered",
    body: `${reminder.memberName} undid that -- not invited yet after all`,
  });

  return result;
}
