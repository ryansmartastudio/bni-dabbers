"use server";

import {
  getBlockedNames,
  submitContact,
  type SubmitInput,
} from "@/lib/workshop/contacts";
import { joinWorkshop, leaveWorkshop } from "@/lib/workshop/participants";
import { getWorkshopRoster } from "@/lib/workshop/roster";
import { isSamePerson, normaliseText } from "@/lib/workshop/normalise";
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


/**
 * Signs a member into the room so the board can show who is here.
 *
 * The submitted name is resolved back to the roster and stored in the roster's
 * own spelling. The lobby is projected to the room, so nothing reaches it
 * straight from a request body — and it keeps one member's display name stable
 * however they typed it or whichever device they used.
 */
export async function joinWorkshopSession(
  name: string,
  team: string,
): Promise<{ ok: boolean; error?: string }> {
  const roster = await getWorkshopRoster();
  const key = normaliseText(name);
  const match =
    roster.find((member) => normaliseText(member.name) === key) ??
    roster.find((member) => isSamePerson(member.name, name));

  if (!match) {
    return { ok: false, error: "Pick your name from the list." };
  }

  const session = await getLiveSession();
  return joinWorkshop(session.id, match.name, team);
}


/**
 * Signs a member out of the room.
 *
 * Used by "Not you?", so a phone handed to the wrong person, or picked from
 * the list by mistake, takes that name off Harry's lobby rather than leaving a
 * ghost in the count he is reading to decide when to start.
 */
export async function leaveWorkshopSession(
  name: string,
): Promise<{ ok: boolean }> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: true };
  const session = await getLiveSession();
  await leaveWorkshop(session.id, trimmed);
  return { ok: true };
}
