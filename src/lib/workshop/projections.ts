import type { WorkshopConstants } from "@/lib/workshop/config";

/**
 * The numbers behind both closing slides.
 *
 * Kept pure and separate from the rendering so they can be checked against the
 * worked example in Harry's spec (80 contacts → 20 visitors → 6 new members →
 * 40 members → 780 connections, +39%).
 */

export type NetworkProjection = {
  contacts: number;
  visitors: number;
  newMembers: number;
  membersToday: number;
  membersAfter: number;
  connectionsToday: number;
  connectionsAfter: number;
  connectionsGrowthPct: number;
};

/** Metcalfe's Law: every member connects to every other. */
export function connections(members: number): number {
  if (members < 2) return 0;
  return (members * (members - 1)) / 2;
}

export function projectNetwork(
  contacts: number,
  c: WorkshopConstants,
): NetworkProjection {
  const visitors = Math.round(contacts * c.visitorRate);
  // Taken from the contact count, not from the rounded visitor figure, so the
  // two steps can't disagree the way sequential rounding would allow.
  const newMembers = Math.round(contacts * c.visitorRate * c.conversionRate);
  const membersAfter = c.membersToday + newMembers;

  const connectionsToday = connections(c.membersToday);
  const connectionsAfter = connections(membersAfter);

  return {
    contacts,
    visitors,
    newMembers,
    membersToday: c.membersToday,
    membersAfter,
    connectionsToday,
    connectionsAfter,
    connectionsGrowthPct:
      connectionsToday === 0
        ? 0
        : ((connectionsAfter - connectionsToday) / connectionsToday) * 100,
  };
}

export type MemberValueRow = {
  key: "given" | "received" | "tyfcb";
  label: string;
  today: number;
  after: number;
  delta: number;
  /** Money is formatted differently from counts. */
  money: boolean;
};

export function projectMemberValue(
  contacts: number,
  c: WorkshopConstants,
): { membersAfter: number; rows: MemberValueRow[] } {
  const { membersToday, membersAfter } = projectNetwork(contacts, c);

  const yearly = (perMemberMonth: number, members: number) =>
    members * perMemberMonth * 12;

  const given = {
    today: yearly(c.referralsGivenPerMemberMonth, membersToday),
    after: yearly(c.referralsGivenPerMemberMonth, membersAfter),
  };
  const received = {
    today: yearly(c.referralsReceivedPerMemberMonth, membersToday),
    after: yearly(c.referralsReceivedPerMemberMonth, membersAfter),
  };
  // TYFTB scales with head count: each new member is assumed to bring in what
  // today's average member does.
  const tyfcb = {
    today: c.tyfcbLast12Months,
    after:
      membersToday === 0
        ? c.tyfcbLast12Months
        : (c.tyfcbLast12Months * membersAfter) / membersToday,
  };

  return {
    membersAfter,
    rows: [
      { key: "given", label: "Referrals given", ...given, delta: given.after - given.today, money: false },
      { key: "received", label: "Referrals received", ...received, delta: received.after - received.today, money: false },
      { key: "tyfcb", label: "Thank You For The Business", ...tyfcb, delta: tyfcb.after - tyfcb.today, money: true },
    ],
  };
}

export function formatCount(value: number): string {
  return Math.round(value).toLocaleString("en-GB");
}

export function formatMoney(value: number): string {
  if (value >= 1_000_000) return `£${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `£${Math.round(value / 1_000)}K`;
  return `£${Math.round(value)}`;
}
