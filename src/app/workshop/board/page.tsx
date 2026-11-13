import { Board } from "@/components/workshop/board";
import { getWorkshopJoinUrl } from "@/lib/workshop";
import { MILESTONE_EVERY } from "@/lib/workshop/config";
import { getBoardSnapshot } from "@/lib/workshop/contacts";
import { listParticipants } from "@/lib/workshop/participants";
import { getLiveSession, resolveState, settleExpiredState } from "@/lib/workshop/session";
import { getChapterSettings } from "@/lib/workshop/settings";
import type { WorkshopSnapshot } from "@/lib/workshop/snapshot";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Board",
};

export default async function WorkshopBoardPage() {
  const session = await getLiveSession();
  const resolved = resolveState(session);
  await settleExpiredState(session, resolved);

  const [board, settings, participants] = await Promise.all([
    getBoardSnapshot(session.id),
    getChapterSettings(),
    listParticipants(session.id),
  ]);

  const revealed =
    resolved.state === "ended" || resolved.state === "slide1" || resolved.state === "slide2";

  const initial: WorkshopSnapshot = {
    version: session.version,
    state: resolved.state,
    secondsLeft: resolved.secondsLeft,
    round1Seconds: session.round1Seconds,
    round2Seconds: session.round2Seconds,
    totalContacts: revealed ? board.totalContacts : null,
    points: board.points,
    seats: board.seats,
    recent: board.recent,
    participants,
    milestones: Math.floor(board.totalContacts / MILESTONE_EVERY),
  };

  return (
    <Board
      initial={initial}
      joinUrl={getWorkshopJoinUrl()}
      chapterLogoUrl={settings.chapterLogoUrl}
    />
  );
}
