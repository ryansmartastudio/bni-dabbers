"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { claimForMe, moveVisitor, releaseMine } from "@/actions/crm";
import {
  CLOSED_STAGES,
  CRM_STAGES,
  STAGE_LABELS,
  type CrmStage,
  type PipelineVisitor,
} from "@/lib/crm/visitors";

type Props = {
  visitors: PipelineVisitor[];
  meId: string;
  meName: string;
};

type Scope = "all" | "mine" | "unclaimed";

/**
 * The board.
 *
 * Six columns that scroll sideways rather than squeezing. The stage control
 * on each card is the primary way to move someone, not a fallback: dragging
 * between six columns on a phone is miserable, and most of this chapter will
 * be doing this on a phone.
 */
export function PipelineBoard({ visitors, meId, meName }: Props) {
  const [scope, setScope] = useState<Scope>("all");
  const [source, setSource] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sources = useMemo(() => {
    const seen = new Map<string, string>();
    for (const visitor of visitors) {
      if (visitor.sourceWorkshopSessionId && visitor.sourceLabel) {
        seen.set(visitor.sourceWorkshopSessionId, visitor.sourceLabel);
      }
    }
    return [...seen.entries()];
  }, [visitors]);

  const hasManual = useMemo(
    () => visitors.some((visitor) => !visitor.sourceWorkshopSessionId),
    [visitors],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return visitors.filter((visitor) => {
      if (scope === "mine" && visitor.ownerMemberId !== meId) return false;
      if (scope === "unclaimed" && visitor.ownerMemberId) return false;
      if (source === "manual" && visitor.sourceWorkshopSessionId) return false;
      if (
        source !== "all" &&
        source !== "manual" &&
        visitor.sourceWorkshopSessionId !== source
      ) {
        return false;
      }
      if (!needle) return true;
      return [visitor.name, visitor.company, visitor.category, visitor.ownerName]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle));
    });
  }, [visitors, scope, source, query, meId]);

  const byStage = useMemo(() => {
    const groups = new Map<CrmStage, PipelineVisitor[]>();
    for (const stage of CRM_STAGES) groups.set(stage, []);
    for (const visitor of filtered) groups.get(visitor.stage)?.push(visitor);
    return groups;
  }, [filtered]);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "That didn't work.");
    });
  }

  const mine = visitors.filter((visitor) => visitor.ownerMemberId === meId).length;
  const unclaimed = visitors.filter((visitor) => !visitor.ownerMemberId).length;

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Visitor pipeline</h1>
        <p className="mt-1 text-sm text-muted">
          Everyone the chapter could invite, and where each one has got to.{" "}
          {unclaimed > 0 ? (
            <>
              <strong className="font-semibold text-foreground">{unclaimed}</strong> still
              need someone to take them on.
            </>
          ) : (
            "Every visitor has someone on it."
          )}
        </p>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-border bg-white p-0.5">
          {(
            [
              ["all", `Everyone (${visitors.length})`],
              ["mine", `Mine (${mine})`],
              ["unclaimed", `Unclaimed (${unclaimed})`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setScope(value)}
              className={`rounded-[10px] px-3 py-1.5 text-sm font-semibold transition ${
                scope === value
                  ? "bg-bni text-white"
                  : "text-foreground hover:bg-surface-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {sources.length > 0 || hasManual ? (
          <select
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground"
            aria-label="Filter by where they came from"
          >
            <option value="all">All sources</option>
            {sources.map(([id, label]) => (
              <option key={id} value={id}>
                Workshop · {label}
              </option>
            ))}
            {hasManual ? <option value="manual">Added by hand</option> : null}
          </select>
        ) : null}

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, company or who has them…"
          className="min-w-[14rem] flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/20"
        />
      </div>

      {error ? (
        <p role="alert" className="mb-4 text-sm font-semibold text-bni">
          {error}
        </p>
      ) : null}

      {visitors.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-8 text-center">
          <p className="text-base font-semibold text-foreground">
            Nothing in the pipeline yet.
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Once a workshop is brought across, everyone the room suggested shows up
            here. You can also add someone by hand at any time.
          </p>
        </div>
      ) : (
        <div
          className={`flex gap-4 overflow-x-auto pb-4 ${pending ? "opacity-60" : ""}`}
        >
          {CRM_STAGES.map((stage) => {
            const column = byStage.get(stage) ?? [];
            const closed = CLOSED_STAGES.includes(stage);
            return (
              <section
                key={stage}
                className={`flex w-[17.5rem] shrink-0 flex-col rounded-2xl p-3 ${
                  closed ? "bg-surface-muted" : "bg-surface-muted/60"
                }`}
                aria-label={`${STAGE_LABELS[stage]}, ${column.length}`}
              >
                <h2 className="mb-2 flex items-baseline justify-between px-1 text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
                  {STAGE_LABELS[stage]}
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {column.length}
                  </span>
                </h2>

                <div className="flex flex-col gap-2">
                  {column.map((visitor) => {
                    const isMine = visitor.ownerMemberId === meId;
                    const canMove = !visitor.ownerMemberId || isMine;
                    return (
                      <article
                        key={visitor.id}
                        className="rounded-xl border border-border bg-white p-3"
                      >
                        <Link
                          href={`/crm/visitor/${visitor.id}`}
                          className="block font-bold leading-tight text-foreground underline-offset-2 hover:underline"
                        >
                          {visitor.name}
                        </Link>
                        {visitor.company ? (
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {visitor.company}
                          </p>
                        ) : null}
                        {visitor.category ? (
                          <p className="mt-1.5 inline-block rounded-md bg-surface-muted px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted">
                            {visitor.category}
                          </p>
                        ) : null}

                        <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
                          {visitor.ownerName ? (
                            <>
                              <span className="font-semibold text-foreground">
                                {isMine ? "You" : visitor.ownerName}
                              </span>
                              {visitor.sourceLabel ? ` · ${visitor.sourceLabel}` : ""}
                            </>
                          ) : (
                            <span className="font-semibold text-bni">Nobody yet</span>
                          )}
                          {visitor.noteCount > 0
                            ? ` · ${visitor.noteCount} note${visitor.noteCount === 1 ? "" : "s"}`
                            : ""}
                        </p>

                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {visitor.ownerMemberId ? null : (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => run(() => claimForMe(visitor.id))}
                              className="rounded-lg bg-bni px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                            >
                              I&rsquo;ll invite them
                            </button>
                          )}
                          {isMine ? (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => run(() => releaseMine(visitor.id))}
                              className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground disabled:opacity-60"
                            >
                              Release
                            </button>
                          ) : null}
                        </div>

                        {canMove ? (
                          <label className="mt-2 block">
                            <span className="sr-only">
                              Stage for {visitor.name}
                            </span>
                            <select
                              value={visitor.stage}
                              disabled={pending}
                              onChange={(event) =>
                                run(() => moveVisitor(visitor.id, event.target.value))
                              }
                              className="w-full rounded-lg border border-border bg-white px-2 py-1.5 text-xs font-semibold text-foreground"
                            >
                              {CRM_STAGES.map((option) => (
                                <option key={option} value={option}>
                                  {STAGE_LABELS[option]}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : (
                          <p className="mt-2 text-[11px] text-ink-muted">
                            {visitor.ownerName?.split(" ")[0]} is on this one.
                          </p>
                        )}
                      </article>
                    );
                  })}

                  {column.length === 0 ? (
                    <p className="px-1 py-3 text-xs text-ink-muted">Nobody here.</p>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-2 text-xs text-ink-muted">
        Anyone can add a note. Moving someone through the stages is for whoever took
        them on, so two people cannot quietly undo each other.
      </p>
      <p className="sr-only">Signed in as {meName}</p>
    </div>
  );
}
