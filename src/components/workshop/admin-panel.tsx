"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  deleteAllWorkshopData,
  endRoundEarly,
  resetWorkshop,
  setWorkshopState,
  simulateWorkshopContact,
  updateRoundLengths,
  updateWorkshopConstants,
} from "@/actions/workshop-admin";
import { formatClock, useSnapshot } from "@/components/workshop/use-snapshot";
import { TEAMS, type WorkshopConstants } from "@/lib/workshop/config";
import type { WorkshopSnapshot } from "@/lib/workshop/snapshot";
import type { WorkshopState } from "@/lib/workshop/session";

const POLL_MS = 2000;

type AdminPanelProps = {
  secret: string;
  initial: WorkshopSnapshot;
  constants: WorkshopConstants;
  totalContacts: number;
  joinUrl: string;
  /** Testing tools, shown only when the admin URL carries ?sim=1. */
  showSimulation: boolean;
  /** "" on the workshop subdomain, "/workshop" on the main-domain fallback. */
  basePath: string;
};

const STATE_LABEL: Record<WorkshopState, string> = {
  waiting: "Waiting to start",
  round1: "Round 1 running",
  break: "Between rounds",
  round2: "Round 2 running",
  ended: "Ended — total revealed",
  slide1: "Slide 1 — why we grow",
  slide2: "Slide 2 — what it means",
};

export function AdminPanel({
  secret,
  initial,
  constants,
  totalContacts,
  joinUrl,
  showSimulation,
  basePath,
}: AdminPanelProps) {
  const { snapshot, secondsLeft } = useSnapshot(initial, POLL_MS);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<"reset" | "delete" | null>(null);

  function run(label: string, action: () => Promise<{ ok: boolean; error?: string }>) {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await action();
        setMessage(result.ok ? `${label} ✓` : (result.error ?? "That didn't work."));
      } catch {
        setMessage("That didn't work. Check you're on the right link.");
      }
      setConfirming(null);
    });
  }

  const state = snapshot.state;
  const roundOpen = state === "round1" || state === "round2";

  // Only one button is ever the right next move; it is the one highlighted.
  const next: { label: string; state: WorkshopState } | null =
    state === "waiting"
      ? { label: "Start round 1", state: "round1" }
      : state === "break"
        ? { label: "Start round 2", state: "round2" }
        : state === "ended"
          ? { label: "Show slide 1 — why we grow", state: "slide1" }
          : state === "slide1"
            ? { label: "Show slide 2 — what it means", state: "slide2" }
            : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <p className="marketing-eyebrow">BNI Dabbers · Growth Workshop</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.02em] text-foreground">
        Session controls
      </h1>

      <div className="mt-6 rounded-2xl border border-border bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="marketing-eyebrow">Now</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{STATE_LABEL[state]}</p>
          </div>
          <div className="text-right">
            <p className="marketing-eyebrow">Clock</p>
            <p className="workshop-timer mt-1 text-foreground">
              {roundOpen ? formatClock(secondsLeft) : "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="marketing-eyebrow">Contacts so far</p>
            <p className="mt-1 text-2xl font-bold text-bni">{totalContacts}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TEAMS.map((team) => (
            <div key={team.id} className="rounded-lg bg-surface-muted px-3 py-2">
              <p className="text-xs font-semibold text-muted">{team.name}</p>
              <p className="text-lg font-bold" style={{ color: team.accent }}>
                {snapshot.points[team.id] ?? 0}
              </p>
            </div>
          ))}
        </div>
      </div>

      {next ? (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(next.label, () => setWorkshopState(secret, next.state))}
          className="mt-5 w-full rounded-2xl bg-bni px-6 py-5 text-xl font-bold text-white disabled:opacity-60"
        >
          {next.label}
        </button>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {roundOpen ? (
          <AdminButton
            label="End this round early"
            disabled={isPending}
            onClick={() => run("Round ended", () => endRoundEarly(secret))}
          />
        ) : null}
        {state === "slide2" || state === "slide1" ? (
          <AdminButton
            label="Back to final scores"
            disabled={isPending}
            onClick={() => run("Back to scores", () => setWorkshopState(secret, "ended"))}
          />
        ) : null}
        {state !== "waiting" ? (
          <AdminButton
            label="Back to the holding screen"
            disabled={isPending}
            onClick={() => run("Holding screen", () => setWorkshopState(secret, "waiting"))}
          />
        ) : null}
        <AdminButton label="Open the board" href={`${basePath}/board`} newTab />
        <AdminButton label="Open the member page" href={`${basePath}/`} newTab />
        <AdminButton label="Download the export (.xlsx)" href={`${basePath}/admin/${secret}/export`} />
        <AdminButton label="Print the QR poster (PDF)" href={`${basePath}/admin/${secret}/poster`} newTab />
      </div>

      {message ? (
        <p className="mt-4 rounded-xl bg-surface-muted px-4 py-3 text-sm font-semibold text-foreground">
          {message}
        </p>
      ) : null}

      {showSimulation ? (
        <Simulation secret={secret} state={state} disabled={isPending} />
      ) : null}

      <RoundLengths secret={secret} snapshot={snapshot} disabled={isPending} onRun={run} />
      <Constants secret={secret} constants={constants} disabled={isPending} onRun={run} />

      <div className="mt-8 rounded-2xl border-2 border-bni bg-[#FDECEE] p-5">
        <h2 className="text-lg font-bold text-[#A51A26]">Careful with these</h2>

        <div className="mt-3 space-y-3">
          <div>
            {confirming === "reset" ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => run("Session reset", () => resetWorkshop(secret))}
                  className="rounded-lg bg-bni px-4 py-2.5 text-sm font-bold text-white"
                >
                  Yes, clear the board and start fresh
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming("reset")}
                className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold"
              >
                Reset for a fresh session
              </button>
            )}
            <p className="mt-1.5 text-xs text-[#A51A26]">
              Clears the board and starts a new session. The old contacts are archived, not
              deleted, so this is recoverable.
            </p>
          </div>

          <div>
            {confirming === "delete" ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => run("All data deleted", () => deleteAllWorkshopData(secret))}
                  className="rounded-lg bg-[#A51A26] px-4 py-2.5 text-sm font-bold text-white"
                >
                  Yes, permanently delete every contact
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming("delete")}
                className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold"
              >
                Delete all data permanently
              </button>
            )}
            <p className="mt-1.5 text-xs text-[#A51A26]">
              Removes every contact from every session and cannot be undone. Take the export
              first. For use once the invitations have been sent.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-ink-muted">
        Members join at <strong className="text-foreground">{joinUrl.replace("https://", "")}</strong>.
        Keep this page to yourself: anyone with the link can control the session.
      </p>
    </div>
  );
}

function AdminButton({
  label,
  onClick,
  href,
  disabled,
  newTab,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  newTab?: boolean;
}) {
  const className =
    "block rounded-xl border border-border bg-white px-4 py-3.5 text-center text-sm font-semibold text-foreground transition hover:bg-surface-muted disabled:opacity-60";

  if (href) {
    return (
      <Link href={href} className={className} target={newTab ? "_blank" : undefined}>
        {label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {label}
    </button>
  );
}

function RoundLengths({
  secret,
  snapshot,
  disabled,
  onRun,
}: {
  secret: string;
  snapshot: WorkshopSnapshot;
  disabled: boolean;
  onRun: (label: string, action: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [r1, setR1] = useState(String(snapshot.round1Seconds));
  const [r2, setR2] = useState(String(snapshot.round2Seconds));

  return (
    <section className="mt-6 rounded-2xl border border-border bg-white p-5">
      <h2 className="text-lg font-bold text-foreground">Round lengths</h2>
      <p className="mt-1 text-sm text-muted">
        In seconds. Takes effect the next time a round starts.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">Round 1</span>
          <input
            value={r1}
            onChange={(e) => setR1(e.target.value)}
            inputMode="numeric"
            className="w-28 rounded-lg border border-border px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">Round 2</span>
          <input
            value={r2}
            onChange={(e) => setR2(e.target.value)}
            inputMode="numeric"
            className="w-28 rounded-lg border border-border px-3 py-2 text-sm"
          />
        </label>
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onRun("Round lengths saved", () =>
              updateRoundLengths(secret, Number(r1), Number(r2)),
            )
          }
          className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          Save
        </button>
      </div>
    </section>
  );
}

const CONSTANT_FIELDS: Array<{ key: keyof WorkshopConstants; label: string; hint: string }> = [
  { key: "membersToday", label: "Members today", hint: "Harry's plan says 34" },
  { key: "visitorRate", label: "Visitor rate", hint: "0.25 = a quarter come along" },
  { key: "conversionRate", label: "Conversion rate", hint: "0.283 of visitors join" },
  { key: "referralsGivenPerMemberMonth", label: "Referrals given", hint: "per member per month" },
  { key: "referralsReceivedPerMemberMonth", label: "Referrals received", hint: "per member per month" },
  { key: "tyfcbLast12Months", label: "TYFTB, last 12 months", hint: "in pounds" },
];

function Constants({
  secret,
  constants,
  disabled,
  onRun,
}: {
  secret: string;
  constants: WorkshopConstants;
  disabled: boolean;
  onRun: (label: string, action: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(CONSTANT_FIELDS.map((f) => [f.key, String(constants[f.key])])),
  );

  return (
    <section className="mt-6 rounded-2xl border border-border bg-white p-5">
      <h2 className="text-lg font-bold text-foreground">Closing slide numbers</h2>
      <p className="mt-1 text-sm text-muted">
        These drive both closing slides. They come from Harry&rsquo;s Growth Plan and
        deliberately differ from the live figures on bnidabbers.co.uk.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {CONSTANT_FIELDS.map((field) => (
          <label key={field.key} className="block">
            <span className="mb-1 block text-xs font-semibold text-foreground">
              {field.label}{" "}
              <em className="font-normal not-italic text-muted">({field.hint})</em>
            </span>
            <input
              value={values[field.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              inputMode="decimal"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          onRun("Slide numbers saved", () => {
            const parsed: Partial<WorkshopConstants> = {};
            for (const field of CONSTANT_FIELDS) {
              const n = Number(values[field.key]);
              if (Number.isFinite(n) && n >= 0) parsed[field.key] = n;
            }
            return updateWorkshopConstants(secret, parsed);
          })
        }
        className="mt-4 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        Save slide numbers
      </button>
    </section>
  );
}

/**
 * Drives fake submissions so the board can be rehearsed.
 *
 * Fires one contact at a time on an interval rather than inserting a batch, so
 * the pips, the ticker, the rolling scores and the every-ten celebration all
 * behave as they will with a room full of phones.
 */
function Simulation({
  secret,
  state,
  disabled,
}: {
  secret: string;
  state: WorkshopState;
  disabled: boolean;
}) {
  const [running, setRunning] = useState(false);
  const [sent, setSent] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const roundOpen = state === "round1" || state === "round2";

  async function burst(count: number, gapMs: number) {
    if (running) return;
    setRunning(true);
    setNote(null);
    let index = Date.now() % 1000;

    for (let i = 0; i < count; i += 1) {
      index += 1;
      try {
        const result = await simulateWorkshopContact(secret, index);
        if (!result.ok) {
          setNote(result.error ?? "Simulation stopped.");
          break;
        }
        setSent((n) => n + 1);
      } catch {
        setNote("Simulation stopped.");
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, gapMs));
    }
    setRunning(false);
  }

  return (
    <section className="mt-6 rounded-2xl border-2 border-dashed border-[#C9A227] bg-[#FFFBEF] p-5">
      <h2 className="text-lg font-bold text-foreground">Testing tools</h2>
      <p className="mt-1 text-sm text-muted">
        Fake contacts for rehearsing the board. Open the admin link without{" "}
        <code className="rounded bg-white px-1 py-0.5 text-xs">?sim=1</code> on the day and
        this section disappears, so there is nothing to switch off under pressure.
      </p>

      {!roundOpen ? (
        <p className="mt-3 text-sm font-semibold text-[#A51A26]">
          Start a round first — simulated contacts go through the same checks as real ones.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled || running || !roundOpen}
          onClick={() => burst(12, 450)}
          className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {running ? "Adding…" : "Simulate the room (12)"}
        </button>
        <button
          type="button"
          disabled={disabled || running || !roundOpen}
          onClick={() => burst(1, 0)}
          className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          Add one contact
        </button>
        <button
          type="button"
          disabled={disabled || running || !roundOpen}
          onClick={() => burst(30, 220)}
          className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          Fast burst (30) — triggers milestones
        </button>
      </div>

      <p className="mt-3 text-xs text-ink-muted">
        {sent} simulated this visit. They are named &ldquo;Demo Co&rdquo; so they stand out
        in the export — clear the data before the real session.
      </p>
      {note ? <p className="mt-2 text-sm font-semibold text-bni">{note}</p> : null}
    </section>
  );
}
