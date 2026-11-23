import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { crmNotes, crmReminders, crmVisitors, members } from "@/db/schema";
import { CRM_STAGES, type CrmStage } from "@/lib/crm/visitors";

/**
 * Chapter-wide figures: who is on what, and what has actually happened.
 *
 * Every query is filtered by chapterId, same as the pipeline. These are
 * other members' performance figures as much as visitors' details, so they
 * are admin-only on top of membership.
 */

export type MemberReportRow = {
  memberId: string;
  name: string;
  claimed: number;
  stillToInvite: number;
  invited: number;
  visitBooked: number;
  visited: number;
  joined: number;
  notNow: number;
  /** Days since their oldest claim that has had no invite yet. */
  waitingLongest: number | null;
};

export type ReportVisitor = {
  id: string;
  name: string;
  company: string | null;
  category: string | null;
  stage: CrmStage;
  ownerMemberId: string | null;
  ownerName: string | null;
  claimedDaysAgo: number | null;
  invitedDaysAgo: number | null;
};

export type ActivityRow = {
  id: string;
  kind: string;
  body: string;
  authorName: string | null;
  visitorId: string;
  visitorName: string;
  createdAt: string;
};

export type ChapterReport = {
  totals: {
    all: number;
    claimed: number;
    unclaimed: number;
    byStage: Record<CrmStage, number>;
  };
  members: MemberReportRow[];
  /** Every claimed visitor, so the page can list them under their member. */
  claimedVisitors: ReportVisitor[];
  /** Claimed over a week ago and still not invited. */
  stale: ReportVisitor[];
  activity: ActivityRow[];
  reminders: { sent: number; yes: number; no: number; unanswered: number };
};

function days(from: Date | null): number | null {
  if (!from) return null;
  return Math.floor((Date.now() - from.getTime()) / 86_400_000);
}

function fullName(first: string | null, last: string | null): string | null {
  return first ? `${first} ${last ?? ""}`.trim() : null;
}

export async function getChapterReport(chapterId: string): Promise<ChapterReport> {
  const stageCount = (stage: CrmStage) =>
    sql<number>`count(*) filter (where ${crmVisitors.stage} = ${stage})::int`;

  const [totals] = await db
    .select({
      all: sql<number>`count(*)::int`,
      claimed: sql<number>`count(${crmVisitors.ownerMemberId})::int`,
      to_invite: stageCount("to_invite"),
      invited: stageCount("invited"),
      visit_booked: stageCount("visit_booked"),
      visited: stageCount("visited"),
      joined: stageCount("joined"),
      not_now: stageCount("not_now"),
    })
    .from(crmVisitors)
    .where(eq(crmVisitors.chapterId, chapterId));

  const memberRows = await db
    .select({
      memberId: members.id,
      first: members.firstName,
      last: members.lastName,
      claimed: sql<number>`count(*)::int`,
      stillToInvite: stageCount("to_invite"),
      invited: stageCount("invited"),
      visitBooked: stageCount("visit_booked"),
      visited: stageCount("visited"),
      joined: stageCount("joined"),
      notNow: stageCount("not_now"),
      oldestOpenClaim: sql<Date | null>`min(${crmVisitors.ownerClaimedAt}) filter (
        where ${crmVisitors.stage} = 'to_invite'
      )`,
    })
    .from(crmVisitors)
    .innerJoin(members, eq(members.id, crmVisitors.ownerMemberId))
    .where(eq(crmVisitors.chapterId, chapterId))
    .groupBy(members.id, members.firstName, members.lastName)
    .orderBy(desc(sql`count(*)`));

  const claimedRows = await db
    .select({
      id: crmVisitors.id,
      name: crmVisitors.name,
      company: crmVisitors.company,
      category: crmVisitors.category,
      stage: crmVisitors.stage,
      ownerMemberId: crmVisitors.ownerMemberId,
      first: members.firstName,
      last: members.lastName,
      claimedAt: crmVisitors.ownerClaimedAt,
      invitedAt: crmVisitors.invitedAt,
    })
    .from(crmVisitors)
    .innerJoin(members, eq(members.id, crmVisitors.ownerMemberId))
    .where(eq(crmVisitors.chapterId, chapterId))
    .orderBy(members.firstName, crmVisitors.name);

  const toVisitor = (row: (typeof claimedRows)[number]): ReportVisitor => ({
    id: row.id,
    name: row.name,
    company: row.company,
    category: row.category,
    stage: row.stage as CrmStage,
    ownerMemberId: row.ownerMemberId,
    ownerName: fullName(row.first, row.last),
    claimedDaysAgo: days(row.claimedAt),
    invitedDaysAgo: days(row.invitedAt),
  });

  const claimedVisitors = claimedRows.map(toVisitor);
  const stale = claimedVisitors
    .filter(
      (visitor) =>
        visitor.stage === "to_invite" &&
        visitor.claimedDaysAgo !== null &&
        visitor.claimedDaysAgo >= 7,
    )
    .sort((a, b) => (b.claimedDaysAgo ?? 0) - (a.claimedDaysAgo ?? 0));

  const activityRows = await db
    .select({
      id: crmNotes.id,
      kind: crmNotes.kind,
      body: crmNotes.body,
      first: members.firstName,
      last: members.lastName,
      visitorId: crmNotes.visitorId,
      visitorName: crmVisitors.name,
      createdAt: crmNotes.createdAt,
    })
    .from(crmNotes)
    .innerJoin(crmVisitors, eq(crmVisitors.id, crmNotes.visitorId))
    .leftJoin(members, eq(members.id, crmNotes.authorMemberId))
    .where(eq(crmNotes.chapterId, chapterId))
    .orderBy(desc(crmNotes.createdAt))
    .limit(40);

  const [reminderRow] = await db
    .select({
      sent: sql<number>`count(*)::int`,
      yes: sql<number>`count(*) filter (where ${crmReminders.answer} = 'yes')::int`,
      no: sql<number>`count(*) filter (where ${crmReminders.answer} = 'no')::int`,
      unanswered: sql<number>`count(*) filter (where ${crmReminders.answer} is null)::int`,
    })
    .from(crmReminders)
    .where(
      and(
        eq(crmReminders.chapterId, chapterId),
        isNotNull(crmReminders.sentAt),
      ),
    );

  const byStage = Object.fromEntries(
    CRM_STAGES.map((stage) => [
      stage,
      (totals as Record<string, number> | undefined)?.[stage] ?? 0,
    ]),
  ) as Record<CrmStage, number>;

  return {
    totals: {
      all: totals?.all ?? 0,
      claimed: totals?.claimed ?? 0,
      unclaimed: (totals?.all ?? 0) - (totals?.claimed ?? 0),
      byStage,
    },
    members: memberRows.map((row) => ({
      memberId: row.memberId,
      name: fullName(row.first, row.last) ?? "Unknown",
      claimed: row.claimed,
      stillToInvite: row.stillToInvite,
      invited: row.invited,
      visitBooked: row.visitBooked,
      visited: row.visited,
      joined: row.joined,
      notNow: row.notNow,
      waitingLongest: days(row.oldestOpenClaim ? new Date(row.oldestOpenClaim) : null),
    })),
    claimedVisitors,
    stale,
    activity: activityRows.map((row) => ({
      id: row.id,
      kind: row.kind,
      body: row.body,
      authorName: fullName(row.first, row.last),
      visitorId: row.visitorId,
      visitorName: row.visitorName,
      createdAt: row.createdAt.toISOString(),
    })),
    reminders: {
      sent: reminderRow?.sent ?? 0,
      yes: reminderRow?.yes ?? 0,
      no: reminderRow?.no ?? 0,
      unanswered: reminderRow?.unanswered ?? 0,
    },
  };
}
