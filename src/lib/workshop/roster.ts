import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members } from "@/db/schema";
import type { TeamId } from "@/lib/workshop/config";
import { isSamePerson, normaliseText } from "@/lib/workshop/normalise";

/**
 * Power team membership, taken from page 2 of the Dabbers Growth Plan 2026/27.
 *
 * Members pick their own name when they join and their team comes from here,
 * so nobody has to remember which power team they are in at 06:45.
 */
const TEAM_BY_MEMBER: Array<{ team: TeamId; names: string[] }> = [
  {
    team: "pt",
    names: [
      "Benjamin Warr-Barnes", "Daniel Corden", "Danny Bland", "James Starkey",
      "Roy Chesworth", "Dale Cox", "Daniel Scott", "Oliver Cooper",
    ],
  },
  {
    team: "hl",
    names: [
      "Travis Alcott", "Lauren Tudor", "Jon Griffiths", "Layla Dean",
      "Kyle Watt", "Richard Capener", "Megan Gilsenan", "Joel Dovey",
    ],
  },
  {
    team: "bs",
    names: [
      "Penelope Trotman", "Matt Fludgate", "Jason Munnelly", "Jamie Riseley",
      "Jack Beaumont", "Cheryl Mckay", "Robert Adams", "Jez Touch",
      "Harry Heath", "Martin Neal",
    ],
  },
  {
    team: "mv",
    names: [
      "Bex Widdowson", "Heather Pritchett", "Lee Taylor", "Lisa Gallimore",
      "Ryan McCandless", "Darren Page", "Sam Taylor", "Marc Halstead",
    ],
  },
];

/** The 34 from the plan, used if the live roster can't be read. */
const FALLBACK_ROSTER = TEAM_BY_MEMBER.flatMap((group) =>
  group.names.map((name) => ({ name, seat: "", team: group.team })),
);

export type RosterMember = {
  name: string;
  seat: string;
  /** Null when the member joined after the Growth Plan was written. */
  team: TeamId | null;
};

export function teamForMember(name: string): TeamId | null {
  for (const group of TEAM_BY_MEMBER) {
    if (group.names.some((known) => isSamePerson(name, known))) return group.team;
  }
  return null;
}

export function memberKey(name: string): string {
  return normaliseText(name);
}

/**
 * Everyone who could be in the room.
 *
 * Names come from the live roster so the spelling matches what members expect,
 * and so the two who joined since the Growth Plan was written (and therefore
 * have no team in it) can still sign in — they pick their team by hand.
 */
export async function getWorkshopRoster(): Promise<RosterMember[]> {
  try {
    const rows = await db
      .select({
        first: members.firstName,
        last: members.lastName,
        seat: members.bniSeat,
      })
      .from(members)
      .where(eq(members.status, "active"));

    if (rows.length === 0) return FALLBACK_ROSTER;

    return rows
      .map((row) => {
        const name = `${row.first} ${row.last}`.trim();
        return { name, seat: row.seat ?? "", team: teamForMember(name) };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "en-GB"));
  } catch {
    return FALLBACK_ROSTER;
  }
}
