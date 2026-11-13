import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { workshopParticipants } from "@/db/schema";
import { isTeamId, type TeamId } from "@/lib/workshop/config";
import { memberKey } from "@/lib/workshop/roster";

export type Participant = { name: string; team: TeamId };

/**
 * Records a member as being in the room.
 *
 * Idempotent on purpose: a reload, a flaky connection or switching teams must
 * update the one row rather than add another, or Harry's lobby count would
 * drift away from the number of people actually sitting there.
 */
export async function joinWorkshop(
  sessionId: string,
  name: string,
  team: string,
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Pick your name from the list." };
  if (!isTeamId(team)) return { ok: false, error: "Pick your power team." };

  await db
    .insert(workshopParticipants)
    .values({ sessionId, memberName: trimmed, memberKey: memberKey(trimmed), team })
    .onConflictDoUpdate({
      target: [workshopParticipants.sessionId, workshopParticipants.memberKey],
      set: { memberName: trimmed, team },
    });

  return { ok: true };
}

export async function listParticipants(sessionId: string): Promise<Participant[]> {
  const rows = await db
    .select({ name: workshopParticipants.memberName, team: workshopParticipants.team })
    .from(workshopParticipants)
    .where(eq(workshopParticipants.sessionId, sessionId))
    .orderBy(asc(workshopParticipants.joinedAt));

  return rows
    .filter((row) => isTeamId(row.team))
    .map((row) => ({ name: row.name, team: row.team as TeamId }));
}

/** Removes a member from the room, so the board stops counting them. */
export async function leaveWorkshop(
  sessionId: string,
  name: string,
): Promise<void> {
  await db
    .delete(workshopParticipants)
    .where(
      and(
        eq(workshopParticipants.sessionId, sessionId),
        eq(workshopParticipants.memberKey, memberKey(name)),
      ),
    );
}
