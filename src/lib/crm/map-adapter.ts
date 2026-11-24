import { TEAMS, type TeamId } from "@/lib/workshop/config";
import { normaliseText } from "@/lib/workshop/normalise";
import type { PortalContact } from "@/lib/workshop/portal";
import type { PipelineVisitor } from "@/lib/crm/visitors";

/**
 * Pipeline visitors, in the shape the workshop's invite map already draws.
 *
 * The radial tree is a thousand lines of worked-out geometry -- minimum arc
 * spans so a one-person category is still labelled, short names for seats
 * that never fit, hover handling that lets the pointer reach the card. None
 * of that is CRM-specific, so this adapts the data rather than drawing a
 * second chart.
 */

/** Seat name -> the power team that owns it, built once from the config. */
const TEAM_BY_SEAT = new Map<string, TeamId>();
for (const team of TEAMS) {
  for (const seat of team.seats) {
    TEAM_BY_SEAT.set(normaliseText(seat), team.id);
  }
}

/**
 * Crude stemmer, enough to see that "building", "builder" and "build" are
 * the same word and that "brokerage" is a "broker".
 *
 * Deliberately not a real stemmer. It only has to connect the handful of
 * endings people vary when they type a trade into a box, and anything
 * cleverer would start merging words that are genuinely different.
 */
function stem(word: string): string {
  let out = word;
  // "y" is in here for the -grapher/-graphy pair: without it "Videography"
  // misses the Videographer seat and "Commercial photography" misses
  // Commercial Photographer, which are exactly the words people type.
  for (const suffix of ["ages", "age", "ings", "ing", "ers", "er", "s", "y"]) {
    if (out.length > suffix.length + 2 && out.endsWith(suffix)) {
      out = out.slice(0, -suffix.length);
      break;
    }
  }
  return out;
}

function words(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2)
    .map(stem);
}

/**
 * Words that belong to exactly one seat, and which seat.
 *
 * The distinctiveness test is what stops "Commercial flooring" being filed
 * under Commercial Cleaning. "Commercial" is in three seat names, so it
 * carries no information; "cleaning" is in one, so it does. Matching on
 * shared words without this would put a flooring company in with the
 * cleaners and nobody would notice until a member rang them.
 */
const SEAT_BY_DISTINCTIVE_WORD = (() => {
  const seen = new Map<string, Set<TeamId>>();
  for (const team of TEAMS) {
    for (const seat of team.seats) {
      for (const word of words(seat)) {
        const teams = seen.get(word) ?? new Set<TeamId>();
        teams.add(team.id);
        seen.set(word, teams);
      }
    }
  }
  // A word shared by two teams cannot decide between them.
  const unique = new Map<string, TeamId>();
  for (const [word, teams] of seen) {
    if (teams.size === 1) unique.set(word, [...teams][0]!);
  }
  return unique;
})();

/**
 * Which team's seat a visitor's trade belongs to.
 *
 * Exact match first. Failing that, a trade counts as the same seat when it
 * shares a word that belongs to one team and no word that belongs to
 * another -- so "Energy & Utilities Brokerage" finds the Energy & Utilities
 * Broker seat, and "Kitchen installer" finds Kitchen & Bathroom Installer,
 * while "Loft Ladders" and "Landscaper" correctly find nothing, because the
 * chapter has no seat for them.
 *
 * Before this, every one of those sat in the same grey "no seat" lump, which
 * read as a fault in the map rather than as a trade nobody holds.
 */
export function seatTeamFor(category: string | null): TeamId | null {
  if (!category) return null;

  const exact = TEAM_BY_SEAT.get(normaliseText(category));
  if (exact) return exact;

  const matched = new Set<TeamId>();
  for (const word of words(category)) {
    const team = SEAT_BY_DISTINCTIVE_WORD.get(word);
    if (team) matched.add(team);
  }

  // Two teams means the trade straddles them, which is not something to
  // guess at: it goes in the unseated group with its own label.
  return matched.size === 1 ? [...matched][0]! : null;
}

export function toMapContacts(visitors: PipelineVisitor[]): PortalContact[] {
  return visitors.map((visitor) => ({
    id: visitor.id,
    contactName: visitor.name,
    company: visitor.company ?? "",
    phone: visitor.phone,
    email: visitor.email,
    website: visitor.website,
    // The CRM's notes are a timeline, not a field. The map only ever shows a
    // line of text, so it gets the count rather than a note it cannot render.
    notes:
      visitor.noteCount > 0
        ? `${visitor.noteCount} note${visitor.noteCount === 1 ? "" : "s"} on their page`
        : null,
    category: visitor.category ?? "Other",
    seat: visitor.category ?? "Other",
    seatTeam: seatTeamFor(visitor.category),
    submitterName: null,
    claimedBy: visitor.ownerName,
    claimedAt: visitor.ownerClaimedAt,
    invitedAt: visitor.invitedAt,
    round: 1,
  }));
}
