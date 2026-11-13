import Link from "next/link";
import type { ArchivedSession } from "@/lib/workshop/session";

const STATE_LABEL: Record<string, string> = {
  waiting: "Not started",
  round1: "Stopped during round 1",
  break: "Stopped between rounds",
  round2: "Stopped during round 2",
  ended: "Completed",
  slide1: "Completed",
  slide2: "Completed",
};

function formatWhen(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Every run of the workshop, newest first.
 *
 * Reset archives rather than deletes, so a chapter night's names are still
 * here if the export was forgotten — which is the whole reason this view
 * exists.
 */
export function SessionHistory({
  sessions,
  secret,
  basePath,
}: {
  sessions: ArchivedSession[];
  secret: string;
  basePath: string;
}) {
  if (sessions.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-dashed border-border bg-white px-5 py-8 text-center text-sm text-muted">
        No sessions yet. The first one is created as soon as somebody opens the member
        page.
      </p>
    );
  }

  // Only the newest live row is the one the app actually reads, so only that
  // one is badged. Any other live rows are leftovers from a cold-start race.
  const currentId = sessions.find((session) => session.isLive)?.id;

  return (
    <div className="mt-6 space-y-3">
      {sessions.map((session) => {
        const isCurrent = session.id === currentId;
        const isOrphan = session.isLive && !isCurrent;
        return (
        <div
          key={session.id}
          className={`rounded-2xl border bg-white p-5 ${
            isCurrent ? "border-bni" : "border-border"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2">
                <span className="text-base font-bold text-foreground">
                  {formatWhen(session.createdAt)}
                </span>
                {isCurrent ? (
                  <span className="rounded-full bg-bni px-2.5 py-0.5 text-[11px] font-bold text-white">
                    LIVE NOW
                  </span>
                ) : isOrphan ? (
                  <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-[11px] font-bold text-ink-muted">
                    UNUSED
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-sm text-muted">
                {STATE_LABEL[session.state] ?? session.state}
                {session.participants > 0
                  ? ` · ${session.participants} ${session.participants === 1 ? "member" : "members"} signed in`
                  : " · nobody signed in"}
              </p>
            </div>

            <Link
              href={`${basePath}/admin/${secret}/export?session=${session.id}`}
              className="shrink-0 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
            >
              Download export
            </Link>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-surface-muted px-3 py-2">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                Round 1
              </dt>
              <dd className="mt-0.5 text-lg font-bold text-foreground">
                {session.round1Contacts}
              </dd>
            </div>
            <div className="rounded-lg bg-surface-muted px-3 py-2">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                Round 2
              </dt>
              <dd className="mt-0.5 text-lg font-bold text-foreground">
                {session.round2Contacts}
              </dd>
            </div>
            <div className="rounded-lg bg-[#FDF1F2] px-3 py-2">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                Total
              </dt>
              <dd className="mt-0.5 text-lg font-bold text-bni">{session.contacts}</dd>
            </div>
          </dl>
        </div>
        );
      })}
    </div>
  );
}
