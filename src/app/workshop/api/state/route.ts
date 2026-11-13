import { NextResponse } from "next/server";
import { MILESTONE_EVERY } from "@/lib/workshop/config";
import { getBoardSnapshot } from "@/lib/workshop/contacts";
import {
  getLiveSession,
  resolveState,
  settleExpiredState,
} from "@/lib/workshop/session";
import type { WorkshopSnapshot } from "@/lib/workshop/snapshot";

export const dynamic = "force-dynamic";

/**
 * Polled by every phone and by the board.
 *
 * Chosen over SSE/WebSockets on purpose: on venue wifi the realistic failure is
 * a dropped connection, and a poll heals itself on the next tick where a socket
 * needs reconnect logic nobody tests until it fails at 06:50.
 */
export async function GET() {
  const session = await getLiveSession();
  const resolved = resolveState(session);
  await settleExpiredState(session, resolved);

  const board = await getBoardSnapshot(session.id);
  const revealed = resolved.state === "ended" || resolved.state === "slide1" || resolved.state === "slide2";

  const snapshot: WorkshopSnapshot = {
    version: session.version,
    state: resolved.state,
    secondsLeft: resolved.secondsLeft,
    round1Seconds: session.round1Seconds,
    round2Seconds: session.round2Seconds,
    // The chapter total is the reveal at the end; never leak it mid-round.
    totalContacts: revealed ? board.totalContacts : null,
    points: board.points,
    seats: board.seats,
    recent: board.recent,
    milestones: Math.floor(board.totalContacts / MILESTONE_EVERY),
  };

  return NextResponse.json(snapshot, {
    headers: { "cache-control": "no-store, max-age=0" },
  });
}
