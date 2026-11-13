import { Board } from "@/components/workshop/board";
import { getWorkshopJoinUrl } from "@/lib/workshop";
import { isValidAdminSecret } from "@/lib/workshop/admin";
import { MILESTONE_EVERY } from "@/lib/workshop/config";
import { getBoardSnapshot } from "@/lib/workshop/contacts";
import { listParticipants } from "@/lib/workshop/participants";
import {
  getLiveSession,
  resolveState,
  sessionConstants,
  settleExpiredState,
} from "@/lib/workshop/session";
import { getChapterSettings } from "@/lib/workshop/settings";
import type { WorkshopSnapshot } from "@/lib/workshop/snapshot";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Board",
};

export default async function WorkshopBoardPage({
  searchParams,
}: PageProps<"/workshop/board">) {
  const query = await searchParams;
  // The projector laptop drives the session when opened with the admin key.
  const key = typeof query.key === "string" ? query.key : "";
  const controlSecret = isValidAdminSecret(key) ? key : null;

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
    sessionId: session.id,
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
      constants={sessionConstants(session)}
      controlSecret={controlSecret}
    />
  );
}
