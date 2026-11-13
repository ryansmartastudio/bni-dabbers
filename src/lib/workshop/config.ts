/**
 * Contact Collector — every tunable number in one place.
 *
 * Source of truth: Harry Heath's build spec and web app brief for the Dabbers
 * Growth Workshop, 19 November 2026. These deliberately differ from the live
 * chapter data on bnidabbers.co.uk (36 active members, £5,939,467 TYFCB synced
 * from BNI Connect on 1 Nov 2026) because Harry is presenting from the printed
 * Growth Plan. He is aware of the gap.
 *
 * Harry can override any of these from the admin screen on the day; the values
 * here are the defaults a fresh session starts with.
 */

export type WorkshopConstants = {
  /** Chapter head count the slides count up from. */
  membersToday: number;
  /** Share of listed contacts expected to attend as visitors. */
  visitorRate: number;
  /** Share of visitors who join — the chapter's actual conversion rate. */
  conversionRate: number;
  /** Referrals given per member per month (PALMS, Mar–Aug 2026: 739 / 160). */
  referralsGivenPerMemberMonth: number;
  /** Referrals received per member per month (PALMS, Mar–Aug 2026: 764 / 160). */
  referralsReceivedPerMemberMonth: number;
  /** Thank You For The Business, last 12 months. */
  tyfcbLast12Months: number;
};

export const DEFAULT_CONSTANTS: WorkshopConstants = {
  membersToday: 34,
  visitorRate: 0.25,
  conversionRate: 0.283,
  referralsGivenPerMemberMonth: 739 / 160,
  referralsReceivedPerMemberMonth: 764 / 160,
  tyfcbLast12Months: 6_331_609,
};

/** Names per seat before it is "full" and extra names start scoring triple. */
export const NAMES_PER_SEAT = 4;
export const POINTS_NORMAL = 1;
export const POINTS_TRIPLE = 3;

/** Round lengths in seconds. Round 2 only starts when an admin presses the button. */
export const ROUND_DURATIONS = { round1: 240, round2: 120 } as const;

/** A full-screen celebration fires on the board every time this many land. */
export const MILESTONE_EVERY = 10;

export type TeamId = "pt" | "hl" | "bs" | "mv";

export type Team = {
  id: TeamId;
  name: string;
  /** Accent used for the team's identity across phone, board and export. */
  accent: string;
  /** Column background on the board. */
  surface: string;
  /** Column needs a visible edge when its surface is white. */
  outlined?: boolean;
  seats: string[];
};

export const TEAMS: Team[] = [
  {
    id: "pt",
    name: "Property & Trades",
    accent: "#CF2030",
    surface: "#FBE8EA",
    seats: [
      "Builder / General Contractor",
      "Architect / Arch. Technician",
      "Roofer",
      "Kitchen & Bathroom Installer",
      "CCTV & Security",
    ],
  },
  {
    id: "hl",
    name: "Home & Life Events",
    accent: "#8E1520",
    surface: "#FFFFFF",
    outlined: true,
    seats: [
      "Estate & Lettings Agent",
      "Conveyancing Solicitor",
      "Removals & Storage",
      "Later-Life Care Provider",
      "Interior Designer",
    ],
  },
  {
    id: "bs",
    name: "Business Services",
    accent: "#3D3F43",
    surface: "#DCDCDD",
    seats: [
      "Energy & Utilities Broker",
      "Commercial Cleaning",
      "Office Supplies",
      "Commercial Solicitor",
      "Cyber Security",
    ],
  },
  {
    id: "mv",
    name: "Marketing & Visual",
    accent: "#7A7C80",
    surface: "#F4F4F4",
    seats: [
      "Commercial Photographer",
      "Videographer",
      "Promotional Products",
      "Event Planner",
      "SEO / Lead Gen",
    ],
  },
];

/** Sentinel seat index for a team's free-text "Other" contact. */
export const OTHER_SEAT = -1;

export const SEATS_PER_TEAM = 5;
export const TEAM_TARGET = SEATS_PER_TEAM * NAMES_PER_SEAT;
export const CHAPTER_TARGET = TEAM_TARGET * TEAMS.length;

export function getTeam(id: string): Team | undefined {
  return TEAMS.find((team) => team.id === id);
}

export function isTeamId(value: string): value is TeamId {
  return TEAMS.some((team) => team.id === value);
}

/** The seat's display name, or the typed category for an "Other" contact. */
export function seatLabel(teamId: string, seatIndex: number): string | null {
  const team = getTeam(teamId);
  if (!team) return null;
  if (seatIndex === OTHER_SEAT) return "Other";
  return team.seats[seatIndex] ?? null;
}
