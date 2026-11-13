"use server";

import {
  getBlockedNames,
  submitContact,
  type SubmitInput,
} from "@/lib/workshop/contacts";
import { joinWorkshop } from "@/lib/workshop/participants";
import { getLiveSession, resolveState, roundNumber } from "@/lib/workshop/session";

export type SubmitResponse = {
  ok: boolean;
  error?: string;
  points?: number;
  seatIndex?: number;
  seatTeam?: string;
  category?: string;
};

/**
 * Adds one contact. The round is re-checked here against the server clock, so
 * a phone that lagged past the buzzer cannot slip a late submission through.
 */
export async function addWorkshopContact(
  input: SubmitInput,
): Promise<SubmitResponse> {
  const session = await getLiveSession();
  const resolved = resolveState(session);
  const round = roundNumber(resolved.state);

  if (!round) {
    return { ok: false, error: "That round has closed. Look at the big screen." };
  }

  // Round 1 is own-team only; the client hides other teams but the server decides.
  if (round === 1 && input.seatTeam !== input.submitterTeam) {
    return { ok: false, error: "Round 1 is your own team's seats only." };
  }

  const blocked = await getBlockedNames();
  const result = await submitContact(session.id, round, input, blocked);

  if (!result.ok) return { ok: false, error: result.error };

  return {
    ok: true,
    points: result.contact.points,
    seatIndex: result.contact.seatIndex,
    seatTeam: result.contact.seatTeam,
    category: result.contact.category,
  };
}


/** Signs a member into the room so the board can show who is here. */
export async function joinWorkshopSession(
  name: string,
  team: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getLiveSession();
  return joinWorkshop(session.id, name, team);
}
