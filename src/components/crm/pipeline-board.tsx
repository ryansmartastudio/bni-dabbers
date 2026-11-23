"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useReducedMotion } from "motion/react";
import { claimForMe, moveVisitor, releaseMine } from "@/actions/crm";
import dynamic from "next/dynamic";
import { toMapContacts } from "@/lib/crm/map-adapter";
import {
  CLOSED_STAGES,
  CRM_STAGES,
  STAGE_LABELS,
  type CrmStage,
  type PipelineVisitor,
} from "@/lib/crm/visitors";

/**
 * Client-only, and not merely for weight.
 *
 * The map is a thousand arcs built from Math.sin/Math.cos, and those are
 * implementation-defined: Node and the browser disagree in the last digit, so
 * a server-rendered path is "234.5002204123792" where the client wants
 * "234.50022041237924". React calls that a hydration mismatch and refuses to
 * patch it. Drawing it only in the browser removes the disagreement, and the
 * chart is desktop furniture that nothing needs in the first HTML anyway.
 */
const ContactMap = dynamic(
  () =>
    import("@/components/workshop/portal/contact-map").then(
      (mod) => mod.ContactMap,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="p-8 text-center text-sm text-muted">Drawing the map…</p>
    ),
  },
);

type Scope = "all" | "mine" | "unclaimed";

type Props = {
  visitors: PipelineVisitor[];
  meId: string;
  meName: string;
  scope: Scope;
  view: "board" | "map";
};

const SCOPE_TITLES: Record<Scope, string> = {
  all: "Visitor pipeline",
  mine: "The ones I'm on",
  unclaimed: "Nobody on these yet",
};

/**
 * The board.
 *
 * Two scroll surfaces, not one: the columns scroll sideways as a strip and
 * each column scrolls its own cards. A single page scroll was fine with an
 * empty board and useless with a hundred and seven -- the column headings
 * disappeared and the short columns left a screen of nothing beside the long
 * one.
 *
 * The stage control on each card is the primary way to move someone, not a
 * fallback: dragging between six columns on a phone is miserable, and most of
 * this chapter is on a phone.
 */
export function PipelineBoard({ visitors, meId, meName, scope, view }: Props) {
  const router = useRouter();
  const reduced = useReducedMotion() ?? false;
  const [source, setSource] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [activeSeat, setActiveSeat] = useState<string | null>(null);
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

  function setView(next: "board" | "map") {
    const params = new URLSearchParams();
    if (scope !== "all") params.set("scope", scope);
    if (next !== "board") params.set("view", next);
    const query = params.toString();
    router.push(query ? `/crm?${query}` : "/crm");
  }

  const unclaimed = filtered.filter((visitor) => !visitor.ownerMemberId).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-border bg-white px-4 pb-3 pt-5 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="text-xl font-bold text-foreground">
            {SCOPE_TITLES[scope]}
          </h1>
          <p className="text-sm text-muted">
            {filtered.length} {filtered.length === 1 ? "person" : "people"}
            {scope === "all" && unclaimed > 0 ? (
              <>
                {" · "}
                <strong className="font-semibold text-foreground">
                  {unclaimed}
                </strong>{" "}
                still need someone
              </>
            ) : null}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-border bg-surface p-0.5">
            {(
              [
                ["board", "Board"],
                ["map", "Map"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setView(value)}
                aria-pressed={view === value}
                className={`rounded-[10px] px-3 py-1.5 text-sm font-semibold transition ${
                  view === value
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                } ${value === "map" ? "hidden lg:block" : ""}`}
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
            className="min-w-[12rem] flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/20"
          />
        </div>

        {error ? (
          <p role="alert" className="mt-2 text-sm font-semibold text-bni">
            {error}
          </p>
        ) : null}
      </header>

      {visitors.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-md text-center">
            <p className="text-base font-semibold text-foreground">
              Nothing in the pipeline yet.
            </p>
            <p className="mt-1 text-sm text-muted">
              Once a workshop is brought across, everyone the room suggested
              shows up here. You can also add someone by hand at any time.
            </p>
          </div>
        </div>
      ) : view === "map" ? (
        <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          <ContactMap
            contacts={toMapContacts(filtered)}
            me={meName}
            activeSeat={activeSeat}
            activeMember={scope === "mine" ? meName : null}
            onSeat={setActiveSeat}
            onOpen={(id) => router.push(`/crm/visitor/${id}`)}
            onClaim={(id) => run(() => claimForMe(id))}
            onRelease={(id) => run(() => releaseMine(id))}
            pending={pending}
            reduced={reduced}
          />
        </div>
      ) : (
        // min-h-0 on every ancestor of a scroll area, or flex children refuse
        // to shrink below their content and the inner overflow never engages.
        <div
          className={`flex min-h-0 flex-1 gap-3 overflow-x-auto p-4 transition-opacity sm:px-6 ${
            pending ? "opacity-60" : ""
          }`}
        >
          {CRM_STAGES.map((stage) => {
            const column = byStage.get(stage) ?? [];
            const closed = CLOSED_STAGES.includes(stage);
            return (
              <section
                key={stage}
                className={`flex w-[16.5rem] shrink-0 flex-col rounded-2xl ${
                  closed ? "bg-surface-muted" : "bg-surface-muted/60"
                }`}
                aria-label={`${STAGE_LABELS[stage]}, ${column.length}`}
              >
                <h2 className="flex shrink-0 items-baseline justify-between px-3 pb-2 pt-3 text-[12px] font-bold uppercase tracking-[0.06em] text-ink-muted">
                  {STAGE_LABELS[stage]}
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {column.length}
                  </span>
                </h2>

                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
                  {column.map((visitor) => {
                    const isMine = visitor.ownerMemberId === meId;
                    const canMove = !visitor.ownerMemberId || isMine;
                    return (
                      <article
                        key={visitor.id}
                        className="rounded-xl border border-border bg-white p-2.5"
                      >
                        <Link
                          href={`/crm/visitor/${visitor.id}`}
                          className="block text-sm font-bold leading-tight text-foreground underline-offset-2 hover:underline"
                        >
                          {visitor.name}
                        </Link>
                        {visitor.company ? (
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {visitor.company}
                          </p>
                        ) : null}
                        {visitor.category ? (
                          <p className="mt-1.5 truncate rounded-md bg-surface-muted px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted">
                            {visitor.category}
                          </p>
                        ) : null}

                        <p className="mt-1.5 truncate text-[11px] text-ink-muted">
                          {visitor.ownerName ? (
                            <span className="font-semibold text-foreground">
                              {isMine ? "You" : visitor.ownerName}
                            </span>
                          ) : (
                            <span className="font-semibold text-bni">
                              Nobody yet
                            </span>
                          )}
                          {visitor.noteCount > 0
                            ? ` · ${visitor.noteCount} note${visitor.noteCount === 1 ? "" : "s"}`
                            : ""}
                        </p>

                        {canMove ? (
                          <div className="mt-2 flex items-center gap-1.5">
                            <label className="min-w-0 flex-1">
                              <span className="sr-only">
                                Stage for {visitor.name}
                              </span>
                              <select
                                value={visitor.stage}
                                disabled={pending}
                                onChange={(event) =>
                                  run(() =>
                                    moveVisitor(visitor.id, event.target.value),
                                  )
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
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() =>
                                run(() =>
                                  isMine
                                    ? releaseMine(visitor.id)
                                    : claimForMe(visitor.id),
                                )
                              }
                              title={
                                isMine
                                  ? "Hand them back to the chapter"
                                  : "Take this one on"
                              }
                              className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold disabled:opacity-60 ${
                                isMine
                                  ? "border border-border text-foreground"
                                  : "bg-bni text-white"
                              }`}
                            >
                              {isMine ? "Release" : "I'll do it"}
                            </button>
                          </div>
                        ) : (
                          <p className="mt-2 truncate text-[11px] text-ink-muted">
                            {visitor.ownerName?.split(" ")[0]} is on this one.
                          </p>
                        )}
                      </article>
                    );
                  })}

                  {column.length === 0 ? (
                    <p className="px-1 py-3 text-xs text-ink-muted">
                      Nobody here.
                    </p>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      )}
      <p className="sr-only">Signed in as {meName}</p>
    </div>
  );
}
