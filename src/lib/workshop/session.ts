import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { workshopSessions, type WorkshopSession } from "@/db/schema";
import {
  DEFAULT_CONSTANTS,
  ROUND_DURATIONS,
  type WorkshopConstants,
} from "@/lib/workshop/config";

export type WorkshopState =
  | "waiting"
  | "round1"
  | "break"
  | "round2"
  | "ended"
  | "slide1"
  | "slide2";

/** States in which the server accepts submissions. */
export function isRoundOpen(state: WorkshopState): boolean {
  return state === "round1" || state === "round2";
}

export function roundNumber(state: WorkshopState): 1 | 2 | null {
  if (state === "round1") return 1;
  if (state === "round2") return 2;
  return null;
}

export async function getLiveSession(): Promise<WorkshopSession> {
  const [existing] = await db
    .select()
    .from(workshopSessions)
    .where(eq(workshopSessions.isLive, true))
    .orderBy(desc(workshopSessions.createdAt))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(workshopSessions)
    .values({
      round1Seconds: ROUND_DURATIONS.round1,
      round2Seconds: ROUND_DURATIONS.round2,
    })
    .returning();

  return created!;
}

export type TimedState = {
  state: WorkshopState;
  /** Whole seconds left in the current round, or null outside a round. */
  secondsLeft: number | null;
  /** True when the stored state has been overtaken by the clock. */
  expired: boolean;
};

/**
 * Resolves the session's real state from the server clock.
 *
 * There is no scheduler: a round that has run out of time still reads as
 * `round1`/`round2` in the database until something notices. Every read
 * resolves it here instead, so the board, the phones and the submit handler
 * can never disagree about whether a round is open.
 */
export function resolveState(
  session: Pick<
    WorkshopSession,
    "state" | "round1StartedAt" | "round2StartedAt" | "round1Seconds" | "round2Seconds"
  >,
  now: Date = new Date(),
): TimedState {
  const state = session.state as WorkshopState;

  const started =
    state === "round1"
      ? session.round1StartedAt
      : state === "round2"
        ? session.round2StartedAt
        : null;

  if (!started) return { state, secondsLeft: null, expired: false };

  const total = state === "round1" ? session.round1Seconds : session.round2Seconds;
  const elapsed = Math.floor((now.getTime() - started.getTime()) / 1000);
  const left = total - elapsed;

  if (left > 0) return { state, secondsLeft: left, expired: false };

  // Round 1 running out pauses for the explanation; round 2 ends the session.
  return {
    state: state === "round1" ? "break" : "ended",
    secondsLeft: 0,
    expired: true,
  };
}

/** Persists a state the clock has already moved past, so the board agrees. */
export async function settleExpiredState(
  session: WorkshopSession,
  resolved: TimedState,
): Promise<void> {
  if (!resolved.expired || resolved.state === session.state) return;
  await db
    .update(workshopSessions)
    .set({
      state: resolved.state,
      version: session.version + 1,
      updatedAt: new Date(),
    })
    .where(eq(workshopSessions.id, session.id));
}

export function sessionConstants(session: WorkshopSession): WorkshopConstants {
  return { ...DEFAULT_CONSTANTS, ...(session.constants ?? {}) };
}
