"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  deleteAllWorkshopData,
  endRoundEarly,
  endWorkshopSession,
  resetWorkshop,
  setPortalPassword,
  setWorkshopState,
  simulateWorkshopContact,
  updateRoundLengths,
  updateWorkshopConstants,
} from "@/actions/workshop-admin";
import { AdminTabs } from "@/components/workshop/admin-tabs";
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
  portalPassword: string;
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
  portalPassword,
}: AdminPanelProps) {
  const { snapshot, secondsLeft } = useSnapshot(initial, POLL_MS);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<"reset" | "delete" | "end" | null>(null);
  // Set once a session has been ended, so the next step can be offered.
  const [justEnded, setJustEnded] = useState<number | null>(null);

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

  function endSession() {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await endWorkshopSession(secret);
        if (result.ok) setJustEnded(result.contacts ?? 0);
        else setMessage(result.error ?? "That didn't work.");
      } catch {
        setMessage("That didn't work. Check you're on the right link.");
      }
      setConfirming(null);
    });
  }

  function startNextSession() {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await resetWorkshop(secret);
        if (result.ok) {
          setJustEnded(null);
          setMessage("New session started ✓");
        } else {
          setMessage(result.error ?? "That didn't work.");
        }
      } catch {
        setMessage("That didn't work. Check you're on the right link.");
      }
      setConfirming(null);
    });
  }

  const state = snapshot.state;
  const roundOpen = state === "round1" || state === "round2";

  // Only one button is ever the right next move; it is the one highlighted.
  // Ending is offered once there is something to end: a round has started, or
  // a run was pulled back to the holding screen with contacts already in.
  const canEnd = state !== "ended" && (state !== "waiting" || totalContacts > 0);
  const showSessionControls = canEnd || state !== "waiting";

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
      <h1 className="mt-2 mb-5 text-3xl font-bold tracking-[-0.02em] text-foreground">
        Session controls
      </h1>
      <AdminTabs
        active="live"
        secret={secret}
        basePath={basePath}
        sim={showSimulation}
      />

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
          className="mt-5 w-full rounded-2xl bg-bni px-6 py-6 text-xl font-bold text-white disabled:opacity-60"
        >
          {next.label}
        </button>
      ) : null}

      {showSessionControls ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {roundOpen ? (
            <AdminButton
              label="End this round early"
              disabled={isPending}
              onClick={() => run("Round ended", () => endRoundEarly(secret))}
            />
          ) : null}
          {state === "slide1" || state === "slide2" ? (
            <AdminButton
              label="Back to the final scores"
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
          {canEnd ? (
            <AdminButton
              label="End the session"
              disabled={isPending}
              onClick={() => setConfirming("end")}
            />
          ) : null}
        </div>
      ) : null}

      {confirming === "end" ? (
        <div className="mt-3 rounded-2xl border-2 border-bni bg-[#FDF1F2] p-5">
          <p className="text-sm font-bold text-foreground">
            End the session now?
          </p>
          <p className="mt-1 text-sm text-muted">
            The board jumps to the final scores and members see the thank-you, so nothing
            more can be added. Nothing is deleted.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={endSession}
              className="rounded-lg bg-bni px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              Yes, end it
            </button>
            <button
              type="button"
              onClick={() => setConfirming(null)}
              className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold"
            >
              Keep going
            </button>
          </div>
        </div>
      ) : null}

      {justEnded !== null ? (
        <div className="mt-3 rounded-2xl border-2 border-[#C9A227] bg-[#FFFBEF] p-5">
          <p className="text-base font-bold text-foreground">
            Session ended — {justEnded} {justEnded === 1 ? "contact" : "contacts"} saved.
          </p>
          <p className="mt-1 text-sm text-muted">
            Take the export before starting a new one. Previous runs stay available either
            way.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`${basePath}/admin/${secret}/export`}
              className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-bold text-white"
            >
              Download the export
            </Link>
            <button
              type="button"
              disabled={isPending}
              onClick={startNextSession}
              className="rounded-lg bg-bni px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              Start a new session
            </button>
            <button
              type="button"
              onClick={() => setJustEnded(null)}
              className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold"
            >
              Not yet
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <p className="mt-3 rounded-xl bg-surface-muted px-4 py-3 text-sm font-semibold text-foreground">
          {message}
        </p>
      ) : null}

      <Section
        title="Open on the screens"
        hint="The board link includes this key, so the arrow keys drive the session from the projector laptop."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <AdminButton
            label="Open the board →"
            href={`${basePath}/board?key=${secret}`}
            newTab
          />
          <AdminButton label="Open the member page →" href={`${basePath}/`} newTab />
        </div>
      </Section>

      <Section
        title="Before you start"
        hint="Set these up once. Changing the round lengths takes effect the next time a round starts."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <AdminButton
            label="Print the QR poster (PDF)"
            href={`${basePath}/admin/${secret}/poster`}
            newTab
          />
          {confirming === "reset" ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => run("New session started", () => resetWorkshop(secret))}
              className="rounded-xl bg-bni px-4 py-3.5 text-sm font-bold text-white"
            >
              Yes, start a new session
            </button>
          ) : (
            <AdminButton
              label="Start a new session"
              onClick={() => setConfirming("reset")}
            />
          )}
        </div>
        {confirming === "reset" ? (
          <p className="mt-2 text-xs text-muted">
            Clears the board and signs everyone out. The current run is archived, not
            deleted.{" "}
            <button
              type="button"
              onClick={() => setConfirming(null)}
              className="font-semibold underline"
            >
              Cancel
            </button>
          </p>
        ) : null}

        <RoundLengths secret={secret} snapshot={snapshot} disabled={isPending} onRun={run} />
        <Constants secret={secret} constants={constants} disabled={isPending} onRun={run} />
      </Section>

      <Section
        title="The members' portal"
        hint="Where members claim the contacts they'll invite. Set a password to open it; clear it to close it again."
      >
        <PortalPassword
          secret={secret}
          current={portalPassword}
          basePath={basePath}
          disabled={isPending}
          onRun={run}
        />
      </Section>

      <Section
        title="After the session"
        hint="The export has a sheet per round and a totals sheet showing who added each contact."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <AdminButton
            label="Download the export (.xlsx)"
            href={`${basePath}/admin/${secret}/export`}
          />
          <AdminButton
            label="Previous sessions"
            href={`${basePath}/admin/${secret}?tab=sessions${showSimulation ? "&sim=1" : ""}`}
          />
        </div>
      </Section>

      {showSimulation ? (
        <Simulation secret={secret} state={state} disabled={isPending} />
      ) : null}

      <details className="mt-6 rounded-2xl border-2 border-bni bg-[#FDECEE] p-5">
        <summary className="cursor-pointer text-sm font-bold text-[#A51A26]">
          Delete everything, permanently
        </summary>
        <p className="mt-2 text-xs text-[#A51A26]">
          Removes every contact from every session and cannot be undone. Take the export
          first. For use once the invitations have gone out.
        </p>
        {confirming === "delete" ? (
          <div className="mt-3 flex flex-wrap gap-2">
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
            className="mt-3 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold"
          >
            Delete all data
          </button>
        )}
      </details>

      <p className="mt-8 text-xs text-ink-muted">
        Members join at <strong className="text-foreground">{joinUrl.replace("https://", "")}</strong>.
        Keep this page to yourself: anyone with the link can control the session.
      </p>
    </div>
  );
}

/** A titled group, so the page reads as three stages rather than one long list. */
function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-ink-muted">
        {title}
      </h2>
      {hint ? <p className="mt-1 mb-3 text-sm text-muted">{hint}</p> : <div className="mb-3" />}
      {children}
    </section>
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
    <div className="mt-3 rounded-2xl border border-border bg-white p-5">
      <h3 className="text-base font-bold text-foreground">Round lengths</h3>
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
    </div>
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
    <div className="mt-3 rounded-2xl border border-border bg-white p-5">
      <h3 className="text-base font-bold text-foreground">Closing slide numbers</h3>
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
    </div>
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

/** Opens or closes the members' portal, and shows where to send them. */
function PortalPassword({
  secret,
  current,
  basePath,
  disabled,
  onRun,
}: {
  secret: string;
  current: string;
  basePath: string;
  disabled: boolean;
  onRun: (label: string, action: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [value, setValue] = useState(current);

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">
            Portal password
          </span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="not set — portal closed"
            className="w-56 rounded-lg border border-border px-3 py-2 text-sm"
          />
        </label>
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onRun(
              value.trim() === "" ? "Portal closed" : "Portal password saved",
              () => setPortalPassword(secret, value),
            )
          }
          className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          Save
        </button>
      </div>

      {current ? (
        <p className="mt-3 text-sm text-muted">
          Members go to{" "}
          <strong className="text-foreground">
            {typeof window === "undefined" ? "" : window.location.host}
            {basePath}/portal
          </strong>{" "}
          and enter this password.
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">
          The portal is closed until a password is set.
        </p>
      )}
    </div>
  );
}
