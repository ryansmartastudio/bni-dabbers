import { MemberApp } from "@/components/workshop/member-app";
import { getBoardSnapshot } from "@/lib/workshop/contacts";
import { getWorkshopRoster } from "@/lib/workshop/roster";
import { getLiveSession, resolveState, settleExpiredState } from "@/lib/workshop/session";
import type { WorkshopSnapshot } from "@/lib/workshop/snapshot";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Add a contact",
};

export default async function WorkshopMemberPage() {
  const session = await getLiveSession();
  const resolved = resolveState(session);
  await settleExpiredState(session, resolved);
  const [board, roster] = await Promise.all([
    getBoardSnapshot(session.id),
    getWorkshopRoster(),
  ]);

  const initial: WorkshopSnapshot = {
    sessionId: session.id,
    version: session.version,
    state: resolved.state,
    secondsLeft: resolved.secondsLeft,
    round1Seconds: session.round1Seconds,
    round2Seconds: session.round2Seconds,
    totalContacts: null,
    points: board.points,
    seats: board.seats,
    recent: [],
    participants: [],
    milestones: 0,
  };

  return <MemberApp initial={initial} roster={roster} />;
}
