import type { TeamId } from "@/lib/workshop/config";
import type { WorkshopState } from "@/lib/workshop/session";

/**
 * The single payload every client polls for.
 *
 * Deliberately carries no contact names: the board renders straight from this,
 * and nothing in it should be unsafe to project onto a wall.
 */
export type WorkshopSnapshot = {
  /**
   * Which run this is. Phones remember who they are, so they need to notice
   * when a new session has started and sign in again.
   */
  sessionId: string;
  version: number;
  state: WorkshopState;
  secondsLeft: number | null;
  round1Seconds: number;
  round2Seconds: number;
  /** Hidden from the board until the session ends. */
  totalContacts: number | null;
  points: Record<TeamId, number>;
  seats: Record<TeamId, number[]>;
  recent: Array<{
    id: string;
    category: string;
    byTeam: TeamId;
    seatTeam: TeamId;
    seatIndex: number;
    points: number;
  }>;
  /** Who has signed in, so Harry can see the room filling before he starts. */
  participants: Array<{ name: string; team: TeamId }>;
  /**
   * How many groups of ten have landed. Lets the board fire its celebration
   * without being told the running total, which stays hidden until the end.
   */
  milestones: number;
};
