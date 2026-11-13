"use server";

import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { workshopContacts, workshopParticipants, workshopSessions } from "@/db/schema";
import { requireAdminSecret } from "@/lib/workshop/admin";
import { ROUND_DURATIONS, type WorkshopConstants } from "@/lib/workshop/config";
import { getLiveSession, resolveState, type WorkshopState } from "@/lib/workshop/session";

type Result = { ok: boolean; error?: string };

async function bump(sessionId: string, patch: Record<string, unknown>) {
  const session = await getLiveSession();
  await db
    .update(workshopSessions)
    .set({ ...patch, version: session.version + 1, updatedAt: new Date() })
    .where(eq(workshopSessions.id, sessionId));
  revalidatePath("/workshop/board");
  revalidatePath("/workshop");
}

export async function setWorkshopState(
  secret: string,
  next: WorkshopState,
): Promise<Result> {
  requireAdminSecret(secret);
  const session = await getLiveSession();

  const patch: Record<string, unknown> = { state: next };
  // Starting a round stamps the server clock; every client derives its
  // countdown from this rather than trusting its own.
  if (next === "round1") patch.round1StartedAt = new Date();
  if (next === "round2") patch.round2StartedAt = new Date();

  await bump(session.id, patch);
  return { ok: true };
}

/** Ends whichever round is running, without waiting for the buzzer. */
export async function endRoundEarly(secret: string): Promise<Result> {
  requireAdminSecret(secret);
  const session = await getLiveSession();
  const resolved = resolveState(session);

  if (resolved.state === "round1") {
    await bump(session.id, { state: "break" });
    return { ok: true };
  }
  if (resolved.state === "round2") {
    await bump(session.id, { state: "ended" });
    return { ok: true };
  }
  return { ok: false, error: "No round is running." };
}

export async function updateWorkshopConstants(
  secret: string,
  constants: Partial<WorkshopConstants>,
): Promise<Result> {
  requireAdminSecret(secret);
  const session = await getLiveSession();
  await bump(session.id, { constants });
  return { ok: true };
}

export async function updateRoundLengths(
  secret: string,
  round1Seconds: number,
  round2Seconds: number,
): Promise<Result> {
  requireAdminSecret(secret);
  const session = await getLiveSession();
  const clamp = (n: number, fallback: number) =>
    Number.isFinite(n) && n >= 15 && n <= 3600 ? Math.round(n) : fallback;

  await bump(session.id, {
    round1Seconds: clamp(round1Seconds, ROUND_DURATIONS.round1),
    round2Seconds: clamp(round2Seconds, ROUND_DURATIONS.round2),
  });
  return { ok: true };
}

/**
 * Clears the session and starts a fresh one, for wiping rehearsal data before
 * the live run. The old rows are archived rather than dropped, so a mistaken
 * press during the session is recoverable.
 */
export async function resetWorkshop(secret: string): Promise<Result> {
  requireAdminSecret(secret);
  const session = await getLiveSession();

  await db
    .update(workshopSessions)
    .set({ isLive: false, updatedAt: new Date() })
    .where(eq(workshopSessions.id, session.id));

  await db.insert(workshopSessions).values({
    round1Seconds: session.round1Seconds,
    round2Seconds: session.round2Seconds,
    constants: session.constants,
  });

  revalidatePath("/workshop/board");
  revalidatePath("/workshop");
  return { ok: true };
}

/**
 * Permanently removes every contact across all sessions. Intended for after the
 * export is taken, since these are third parties who did not hand their details
 * over themselves.
 */
export async function deleteAllWorkshopData(secret: string): Promise<Result> {
  requireAdminSecret(secret);
  await db.delete(workshopContacts);
  await db.delete(workshopParticipants);
  await db.delete(workshopSessions);
  revalidatePath("/workshop/board");
  revalidatePath("/workshop");
  return { ok: true };
}

const SIM_FIRST = [
  "Alex", "Sam", "Chris", "Jordan", "Kate", "Lucy", "Paul", "Rachel",
  "Steve", "Gemma", "Neil", "Hannah", "Ian", "Claire", "Zoe", "Owen",
];
const SIM_LAST = [
  "Hartley", "Bowden", "Ferris", "Latham", "Prentice", "Ashworth",
  "Quinn", "Sutcliffe", "Mallory", "Beck", "Rowntree", "Vance",
];

/**
 * Adds one fake contact, for rehearsing the board.
 *
 * One per call on purpose: the admin screen calls it on a short interval so
 * contacts trickle in and the board animates each arrival, the way it will on
 * the night. Inserting a batch would make everything jump at once and prove
 * nothing about the micro-interactions.
 *
 * Simulated contacts are named so they are obvious in the export, and the
 * controls are hidden unless the admin URL carries ?sim=1.
 */
export async function simulateWorkshopContact(
  secret: string,
  index: number,
): Promise<Result> {
  requireAdminSecret(secret);
  const session = await getLiveSession();
  const resolved = resolveState(session);
  const round = resolved.state === "round1" ? 1 : resolved.state === "round2" ? 2 : null;
  if (!round) return { ok: false, error: "Start a round first." };

  const { TEAMS: teams, OTHER_SEAT: other } = await import("@/lib/workshop/config");
  const { submitContact } = await import("@/lib/workshop/contacts");

  const by = teams[Math.floor(Math.random() * teams.length)]!;
  // Round 1 locks members to their own team's seats; mirror that here.
  const seatTeam = round === 1 ? by : teams[Math.floor(Math.random() * teams.length)]!;
  const seatIndex = Math.floor(Math.random() * 5);

  const first = SIM_FIRST[index % SIM_FIRST.length];
  const last = SIM_LAST[(index * 5) % SIM_LAST.length];
  const name = `${first} ${last} ${index}`;

  const result = await submitContact(
    session.id,
    round,
    {
      // Marked so rehearsal rows are obvious in the export's "Added by" column.
      submitterName: "(simulated)",
      submitterTeam: by.id,
      seatTeam: seatTeam.id,
      seatIndex: seatIndex === 5 ? other : seatIndex,
      contactName: name,
      company: `Demo Co ${index}`,
      category: "",
      phone: "",
      email: "",
    },
    [],
  );

  if (!result.ok) return { ok: false, error: result.error };

  await bump(session.id, {});
  return { ok: true };
}

/**
 * Ends the session from wherever it has got to, jumping straight to the final
 * reveal.
 *
 * Deliberately does not archive: the board stays on the scores while the room
 * is still in it, and members see the thank-you rather than the join screen.
 * Starting the next session is a separate, explicit step.
 */
export async function endWorkshopSession(
  secret: string,
): Promise<Result & { contacts?: number }> {
  requireAdminSecret(secret);
  const session = await getLiveSession();

  const [row] = await db
    .select({ total: count() })
    .from(workshopContacts)
    .where(eq(workshopContacts.sessionId, session.id));

  await bump(session.id, { state: "ended" });
  return { ok: true, contacts: row?.total ?? 0 };
}

/**
 * Sets the password members use to reach the portal.
 *
 * Clearing it closes the portal, which is the right default between sessions:
 * a new run starts with no password until Harry sets one.
 */
export async function setPortalPassword(
  secret: string,
  password: string,
): Promise<Result> {
  requireAdminSecret(secret);
  const session = await getLiveSession();
  const cleaned = password.trim().slice(0, 64);

  if (cleaned !== "" && cleaned.length < 4) {
    return { ok: false, error: "Use at least 4 characters." };
  }

  await bump(session.id, { portalPassword: cleaned === "" ? null : cleaned });
  return { ok: true };
}
