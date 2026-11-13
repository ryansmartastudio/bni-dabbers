import type { TeamId } from "@/lib/workshop/config";
import type { WorkshopState } from "@/lib/workshop/session";

/**
 * The single payload every client polls for.
 *
 * Deliberately carries no contact names: the board renders straight from this,
 * and nothing in it should be unsafe to project onto a wall.
 */
export type WorkshopSnapshot = {
  version: number;
  state: WorkshopState;
  secondsLeft: number | null;
  round1Seconds: number;
  round2Seconds: number;
  /** Hidden from the board until the session ends. */
  totalContacts: number | null;
  points: Record<TeamId, number>;
  seats: Record<TeamId, number[]>;
  recent: Array<{ id: string; category: string; byTeam: TeamId; points: number }>;
};
