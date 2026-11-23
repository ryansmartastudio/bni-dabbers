import Link from "next/link";
import type { ChapterReport } from "@/lib/crm/reports";
import { CRM_STAGES, STAGE_LABELS, type CrmStage } from "@/lib/crm/visitors";

const KIND_LABELS: Record<string, string> = {
  note: "Note",
  stage_change: "Moved",
  claim: "Claimed",
  release: "Released",
  reminder_sent: "Reminder sent",
  reminder_answered: "Reminder answered",
  system: "History",
};

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white px-4 py-3">
      <p className="text-2xl font-bold tabular-nums leading-none text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs font-semibold text-muted">{label}</p>
    </div>
  );
}

function StageChip({ stage }: { stage: CrmStage }) {
  return (
    <span className="shrink-0 rounded-md bg-surface-muted px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted">
      {STAGE_LABELS[stage]}
    </span>
  );
}

/**
 * What the chapter is actually doing with the pipeline.
 *
 * The question this answers is not "how many visitors do we have" -- the
 * board says that -- but "who said they'd invite somebody, and did they".
 * So the shape is per member first, with the names under each one, and the
 * overdue claims pulled out at the top where they cannot be scrolled past.
 */
export function ChapterReportView({ report }: { report: ChapterReport }) {
  const { totals, members, claimedVisitors, stale, activity, reminders } = report;
  const byMember = new Map<string, typeof claimedVisitors>();
  for (const visitor of claimedVisitors) {
    if (!visitor.ownerMemberId) continue;
    const list = byMember.get(visitor.ownerMemberId) ?? [];
    list.push(visitor);
    byMember.set(visitor.ownerMemberId, list);
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5">
          <h1 className="text-xl font-bold text-foreground">Reports</h1>
          <p className="mt-0.5 text-sm text-muted">
            Who has taken a visitor on, and what came of it. Admins only.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Figure value={totals.all} label="In the pipeline" />
          <Figure value={totals.claimed} label="Taken on" />
          <Figure value={totals.unclaimed} label="Nobody on them" />
          <Figure
            value={
              totals.byStage.invited +
              totals.byStage.visit_booked +
              totals.byStage.visited +
              totals.byStage.joined
            }
            label="Invited or further"
          />
        </div>

        <section className="mt-4 rounded-2xl border border-border bg-white p-4">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.06em] text-ink-muted">
            Where everyone has got to
          </h2>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-6">
            {CRM_STAGES.map((stage) => (
              <div key={stage}>
                <dt className="text-[11px] font-semibold text-muted">
                  {STAGE_LABELS[stage]}
                </dt>
                <dd className="text-lg font-bold tabular-nums text-foreground">
                  {totals.byStage[stage]}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {stale.length > 0 ? (
          <section className="mt-4 rounded-2xl border border-bni/30 bg-bni/[0.04] p-4">
            <h2 className="text-sm font-bold text-foreground">
              {stale.length === 1
                ? "One claim is over a week old with no invite"
                : `${stale.length} claims are over a week old with no invite`}
            </h2>
            <ul className="mt-2 space-y-1.5">
              {stale.map((visitor) => (
                <li
                  key={visitor.id}
                  className="flex flex-wrap items-baseline gap-x-2 text-sm"
                >
                  <Link
                    href={`/crm/visitor/${visitor.id}`}
                    className="font-semibold text-foreground underline underline-offset-2"
                  >
                    {visitor.name}
                  </Link>
                  <span className="text-muted">
                    {visitor.ownerName} has had them {visitor.claimedDaysAgo} days
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-4">
          <h2 className="mb-2 text-[12px] font-bold uppercase tracking-[0.06em] text-ink-muted">
            Who has whom
          </h2>

          {members.length === 0 ? (
            <p className="rounded-2xl border border-border bg-white p-4 text-sm text-muted">
              Nobody has taken a visitor on yet. Until somebody does, there is
              nothing here and no reminders will go out.
            </p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <article
                  key={member.memberId}
                  className="rounded-2xl border border-border bg-white p-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h3 className="font-bold text-foreground">{member.name}</h3>
                    <p className="text-sm text-muted">
                      {member.claimed} taken on
                      {member.stillToInvite > 0
                        ? ` · ${member.stillToInvite} not invited yet`
                        : ""}
                      {member.waitingLongest !== null && member.stillToInvite > 0
                        ? ` · longest ${member.waitingLongest} days`
                        : ""}
                    </p>
                  </div>

                  <ul className="mt-2 divide-y divide-border">
                    {(byMember.get(member.memberId) ?? []).map((visitor) => (
                      <li
                        key={visitor.id}
                        className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1.5 text-sm"
                      >
                        <Link
                          href={`/crm/visitor/${visitor.id}`}
                          className="font-semibold text-foreground underline-offset-2 hover:underline"
                        >
                          {visitor.name}
                        </Link>
                        {visitor.company ? (
                          <span className="truncate text-xs text-muted">
                            {visitor.company}
                          </span>
                        ) : null}
                        <span className="ml-auto flex items-center gap-2">
                          {visitor.invitedDaysAgo !== null ? (
                            <span className="text-[11px] text-ink-muted">
                              invited {visitor.invitedDaysAgo}d ago
                            </span>
                          ) : visitor.claimedDaysAgo !== null ? (
                            <span className="text-[11px] text-ink-muted">
                              held {visitor.claimedDaysAgo}d
                            </span>
                          ) : null}
                          <StageChip stage={visitor.stage} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-white p-4">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.06em] text-ink-muted">
              Reminders
            </h2>
            {reminders.sent === 0 ? (
              <p className="mt-2 text-sm text-muted">
                None sent yet. The first goes out a week after somebody takes a
                visitor on.
              </p>
            ) : (
              <dl className="mt-2 grid grid-cols-4 gap-2">
                {(
                  [
                    ["Sent", reminders.sent],
                    ["Yes", reminders.yes],
                    ["Not yet", reminders.no],
                    ["No answer", reminders.unanswered],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] font-semibold text-muted">
                      {label}
                    </dt>
                    <dd className="text-lg font-bold tabular-nums text-foreground">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-white p-4">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.06em] text-ink-muted">
              Lately
            </h2>
            {activity.length === 0 ? (
              <p className="mt-2 text-sm text-muted">
                Nothing has happened yet.
              </p>
            ) : (
              <ol className="mt-2 space-y-2">
                {activity.slice(0, 12).map((entry) => (
                  <li key={entry.id} className="text-sm leading-snug">
                    <Link
                      href={`/crm/visitor/${entry.visitorId}`}
                      className="font-semibold text-foreground underline-offset-2 hover:underline"
                    >
                      {entry.visitorName}
                    </Link>
                    <span className="text-muted">
                      {" — "}
                      {KIND_LABELS[entry.kind] ?? entry.kind}
                      {entry.authorName ? ` by ${entry.authorName}` : ""}
                    </span>
                    <span className="block text-[11px] text-ink-muted">
                      {when(entry.createdAt)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
