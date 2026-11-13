import { MemberApp } from "@/components/workshop/member-app";
import { getBoardSnapshot } from "@/lib/workshop/contacts";
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
  const board = await getBoardSnapshot(session.id);

  const initial: WorkshopSnapshot = {
    version: session.version,
    state: resolved.state,
    secondsLeft: resolved.secondsLeft,
    round1Seconds: session.round1Seconds,
    round2Seconds: session.round2Seconds,
    totalContacts: null,
    points: board.points,
    seats: board.seats,
    recent: [],
  };

  return <MemberApp initial={initial} />;
}
