import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AdminPanel } from "@/components/workshop/admin-panel";
import { AdminTabs, type AdminTabId } from "@/components/workshop/admin-tabs";
import { SessionHistory } from "@/components/workshop/session-history";
import { getWorkshopJoinUrl, isWorkshopHost } from "@/lib/workshop";
import { isValidAdminSecret } from "@/lib/workshop/admin";
import { MILESTONE_EVERY } from "@/lib/workshop/config";
import { getBoardSnapshot } from "@/lib/workshop/contacts";
import {
  getLiveSession,
  listWorkshopSessions,
  resolveState,
  sessionConstants,
  settleExpiredState,
} from "@/lib/workshop/session";
import type { WorkshopSnapshot } from "@/lib/workshop/snapshot";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Session controls",
};

export default async function WorkshopAdminPage({
  params,
  searchParams,
}: PageProps<"/workshop/admin/[secret]">) {
  const { secret } = await params;
  const query = await searchParams;

  // A wrong secret is a 404, not a 403: nothing here should confirm that an
  // admin page exists at this path.
  if (!isValidAdminSecret(secret)) notFound();

  // On the subdomain the proxy strips the /workshop segment; on the main-domain
  // fallback it does not. Links have to agree with whichever host this was
  // opened on, or every button here 404s.
  const host = (await headers()).get("host");
  const basePath = isWorkshopHost(host) ? "" : "/workshop";

  const sim = query.sim === "1";
  const tab: AdminTabId = query.tab === "sessions" ? "sessions" : "live";

  if (tab === "sessions") {
    const sessions = await listWorkshopSessions();
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="marketing-eyebrow">BNI Dabbers · Growth Workshop</p>
        <h1 className="mt-2 mb-5 text-3xl font-bold tracking-[-0.02em] text-foreground">
          Previous sessions
        </h1>
        <AdminTabs active="sessions" secret={secret} basePath={basePath} sim={sim} />
        <SessionHistory sessions={sessions} secret={secret} basePath={basePath} />
      </div>
    );
  }

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
    totalContacts: board.totalContacts,
    points: board.points,
    seats: board.seats,
    recent: board.recent,
    participants: [],
    milestones: Math.floor(board.totalContacts / MILESTONE_EVERY),
  };

  return (
    <AdminPanel
      secret={secret}
      initial={initial}
      constants={sessionConstants(session)}
      totalContacts={board.totalContacts}
      joinUrl={getWorkshopJoinUrl()}
      showSimulation={sim}
      basePath={basePath}
    />
  );
}
