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
 * Which seat a visitor fills.
 *
 * A category typed into the workshop's "Other" box matches nothing, and that
 * is the honest answer: the map groups those under its own unseated branch
 * rather than guessing a team for them.
 */
export function seatTeamFor(category: string | null): TeamId | null {
  if (!category) return null;
  return TEAM_BY_SEAT.get(normaliseText(category)) ?? null;
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
