import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  workshopContacts,
  workshopParticipants,
  workshopSessions,
  type WorkshopSession,
} from "@/db/schema";
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

async function newestLiveSession(): Promise<WorkshopSession | undefined> {
  const [row] = await db
    .select()
    .from(workshopSessions)
    .where(eq(workshopSessions.isLive, true))
    .orderBy(desc(workshopSessions.createdAt))
    .limit(1);
  return row;
}

/**
 * The session everything reads and writes, created on first use.
 *
 * A unique index allows only one live session, so a room full of phones
 * hitting a cold database cannot each create their own and scatter the
 * contacts between them. Losers of that race swallow the conflict and read
 * back the session that won.
 */
export async function getLiveSession(): Promise<WorkshopSession> {
  const existing = await newestLiveSession();
  if (existing) return existing;

  try {
    await db.insert(workshopSessions).values({
      round1Seconds: ROUND_DURATIONS.round1,
      round2Seconds: ROUND_DURATIONS.round2,
    });
  } catch {
    // Someone else won the race; the unique index on is_live rejected ours.
  }

  const settled = await newestLiveSession();
  if (!settled) throw new Error("Could not create a workshop session.");
  return settled;
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

export type ArchivedSession = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  state: WorkshopState;
  isLive: boolean;
  contacts: number;
  participants: number;
  round1Contacts: number;
  round2Contacts: number;
};

/**
 * Every run, newest first, with its headline counts.
 *
 * Reset archives a session rather than deleting it, so the chapter can run the
 * workshop again without losing the last set of names before the export is
 * taken.
 */
export async function listWorkshopSessions(): Promise<ArchivedSession[]> {
  const rows = await db
    .select({
      id: workshopSessions.id,
      createdAt: workshopSessions.createdAt,
      updatedAt: workshopSessions.updatedAt,
      state: workshopSessions.state,
      isLive: workshopSessions.isLive,
    })
    .from(workshopSessions)
    .orderBy(desc(workshopSessions.createdAt));

  if (rows.length === 0) return [];

  const contactCounts = await db
    .select({
      sessionId: workshopContacts.sessionId,
      round: workshopContacts.round,
      total: count(),
    })
    .from(workshopContacts)
    .groupBy(workshopContacts.sessionId, workshopContacts.round);

  const participantCounts = await db
    .select({
      sessionId: workshopParticipants.sessionId,
      total: count(),
    })
    .from(workshopParticipants)
    .groupBy(workshopParticipants.sessionId);

  return rows.map((row) => {
    const mine = contactCounts.filter((c) => c.sessionId === row.id);
    const round1 = mine.find((c) => c.round === 1)?.total ?? 0;
    const round2 = mine.find((c) => c.round === 2)?.total ?? 0;
    return {
      ...row,
      state: row.state as WorkshopState,
      contacts: round1 + round2,
      round1Contacts: round1,
      round2Contacts: round2,
      participants:
        participantCounts.find((p) => p.sessionId === row.id)?.total ?? 0,
    };
  });
}
