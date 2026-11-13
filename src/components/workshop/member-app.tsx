"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, useTransition } from "react";
import {
  addWorkshopContact,
  joinWorkshopAsGuest,
  joinWorkshopSession,
  leaveWorkshopSession,
} from "@/actions/workshop";
import { Confetti } from "@/components/workshop/confetti";
import { ContactImport } from "@/components/workshop/contact-import";
import { JoinStep } from "@/components/workshop/join-step";
import { useStoredIdentity } from "@/components/workshop/team-store";
import { formatClock, useSnapshot } from "@/components/workshop/use-snapshot";
import {
  NAMES_PER_SEAT,
  OTHER_SEAT,
  TEAMS,
  getTeam,
  type TeamId,
} from "@/lib/workshop/config";
import type { WorkshopSnapshot } from "@/lib/workshop/snapshot";
import type { RosterMember } from "@/lib/workshop/roster";
import type { ParsedContact } from "@/lib/workshop/vcard";

const POLL_MS = 2500;

type Chosen = { team: TeamId; index: number };
type FormState = { name: string; company: string; category: string; phone: string; email: string };

const EMPTY_FORM: FormState = { name: "", company: "", category: "", phone: "", email: "" };

function buzz(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Vibration is a nicety; never let it break a submission.
    }
  }
}

export function MemberApp({
  initial,
  roster,
}: {
  initial: WorkshopSnapshot;
  roster: RosterMember[];
}) {
  const reduced = useReducedMotion() ?? false;
  const { snapshot, secondsLeft } = useSnapshot(initial, POLL_MS);

  const [storedIdentity, setIdentity] = useStoredIdentity();
  // A phone that signed in to an earlier session starts again from the list.
  // Carrying it over would have put someone on Harry's lobby for merely
  // opening the page, rather than for being in the room.
  const identity =
    storedIdentity && storedIdentity.sessionId === snapshot.sessionId
      ? storedIdentity
      : null;
  const myTeam = identity?.team ?? null;
  const [joinError, setJoinError] = useState<string | null>(null);
  const [movingTeam, setMovingTeam] = useState(false);
  const [picked, setPicked] = useState<Chosen | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; points: number } | null>(null);
  const [justFilled, setJustFilled] = useState<string | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  function join(name: string, team: TeamId) {
    buzz(10);
    setJoinError(null);
    startTransition(async () => {
      const result = await joinWorkshopSession(name, team);
      if (!result.ok) {
        setJoinError(result.error ?? "Couldn't sign you in. Try again.");
        return;
      }
      // Only remember the identity once the server has it, so a failed join
      // doesn't leave the phone thinking it is signed in.
      setIdentity({ name, team, sessionId: snapshot.sessionId });
      setMovingTeam(false);
    });
  }

  const roundOpen = snapshot.state === "round1" || snapshot.state === "round2";

  // Derived rather than cleared in an effect, so a round closing mid-form drops
  // straight back to the holding screen without an extra render.
  const chosen = roundOpen ? picked : null;
  const setChosen = setPicked;

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  function submit() {
    if (!myTeam || !chosen) return;
    setError(null);
    buzz(10);

    startTransition(async () => {
      const result = await addWorkshopContact({
        submitterName: identity?.name,
        submitterTeam: myTeam,
        seatTeam: chosen.team,
        seatIndex: chosen.index,
        contactName: form.name,
        company: form.company,
        category: form.category,
        phone: form.phone,
        email: form.email,
      });

      if (!result.ok) {
        setError(result.error ?? "Something went wrong. Try again.");
        buzz([40, 60, 40]);
        return;
      }

      // Celebrate only once the server has actually accepted it — a duplicate
      // or a blocked member must never get confetti first and a retraction after.
      setConfettiKey((k) => k + 1);
      buzz([12, 40, 18]);
      setToast({
        text:
          result.points === 3
            ? "Seat already full — triple points!"
            : `Added to ${result.category}`,
        points: result.points ?? 1,
      });
      setJustFilled(`${result.seatTeam}:${result.seatIndex}`);
      setForm(EMPTY_FORM);
      setChosen(null);
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });
  }

  function joinAsGuest(name: string, company: string, team: TeamId) {
    buzz(10);
    setJoinError(null);
    startTransition(async () => {
      const result = await joinWorkshopAsGuest(name, company, team);
      if (!result.ok) {
        setJoinError(result.error ?? "Couldn't sign you in. Try again.");
        return;
      }
      setIdentity({
        name: `${name.trim()} (${company.trim()})`,
        team,
        sessionId: snapshot.sessionId,
      });
    });
  }

  function notMe() {
    const previous = identity;
    setIdentity(null);
    setMovingTeam(false);
    if (!previous) return;
    // Take them off the board as well, or the lobby keeps counting them.
    startTransition(async () => {
      await leaveWorkshopSession(previous.name);
    });
  }

  function applyImport(contact: ParsedContact) {
    setForm((current) => ({
      ...current,
      name: contact.name || current.name,
      company: contact.company || current.company,
      phone: contact.phone || current.phone,
      email: contact.email || current.email,
    }));
    setError(null);
    buzz(8);
  }

  const statusLabel = {
    waiting: "Waiting to start",
    round1: "Round 1 · your team only",
    break: "Round 1 finished",
    round2: "Round 2 · any seat",
    ended: "All done",
    slide1: "All done",
    slide2: "All done",
  }[snapshot.state];

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <Confetti fireKey={confettiKey} reduced={reduced} />

      <header className="bg-bni px-5 pb-4 pt-6 text-white">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/85">
          BNI Dabbers · Growth Workshop
        </p>
        <h1 className="mt-1 text-2xl font-bold">Who should we invite?</h1>
      </header>

      <div className="flex items-center justify-between border-b border-border bg-white px-5 py-3">
        <span className="text-sm font-semibold text-foreground">{statusLabel}</span>
        {roundOpen ? (
          <span
            className={`workshop-timer ${secondsLeft !== null && secondsLeft <= 30 ? "text-bni" : "text-foreground"}`}
          >
            {formatClock(secondsLeft)}
          </span>
        ) : null}
      </div>

      <main className="px-5 py-5">
        <AnimatePresence initial={false}>
          {!myTeam ? (
            <Step key="join" reduced={reduced}>
              <OutsideBniNote />
              <div className="mt-4">
                <JoinStep
                  roster={roster}
                  reduced={reduced}
                  pending={isPending}
                  error={joinError}
                  onJoin={join}
                  onJoinAsGuest={joinAsGuest}
                />
              </div>
            </Step>
          ) : !roundOpen ? (
            <Step key="hold" reduced={reduced}>
              <TeamChip
                identity={identity}
                moving={movingTeam}
                pending={isPending}
                reduced={reduced}
                onNotYou={notMe}
                onMove={() => setMovingTeam((v) => !v)}
                onPickTeam={(team) => identity && join(identity.name, team)}
              />
              <HoldingScreen state={snapshot.state} points={snapshot.points[myTeam] ?? 0} round1Seconds={snapshot.round1Seconds} />
            </Step>
          ) : !chosen ? (
            <Step key="seats" reduced={reduced}>
              <TeamChip
                identity={identity}
                moving={movingTeam}
                pending={isPending}
                reduced={reduced}
                onNotYou={notMe}
                onMove={() => setMovingTeam((v) => !v)}
                onPickTeam={(team) => identity && join(identity.name, team)}
              />
              <OutsideBniNote />
              <h2 className="mt-4 text-xl font-bold text-foreground">Step 1: pick a key seat</h2>
              <p className="mt-1 text-sm text-muted">
                {snapshot.state === "round1"
                  ? "Round 1 shows your own team's seats."
                  : "All 20 seats are open. Aim for the gaps."}{" "}
                Seats with {NAMES_PER_SEAT} names already score{" "}
                <strong className="text-bni">triple points</strong>.
              </p>
              <SeatList
                snapshot={snapshot}
                myTeam={myTeam}
                allTeams={snapshot.state === "round2"}
                justFilled={justFilled}
                reduced={reduced}
                onPick={(pick) => {
                  buzz(8);
                  setChosen(pick);
                  setError(null);
                  setJustFilled(null);
                }}
              />
            </Step>
          ) : (
            <Step key="form" reduced={reduced}>
              <ChosenSeat
                chosen={chosen}
                snapshot={snapshot}
                onBack={() => {
                  setChosen(null);
                  setError(null);
                }}
              />
              <OutsideBniNote compact />
              <div className="mt-4">
                <ContactImport onImport={applyImport} />
              </div>
              <p className="mt-3 text-xs text-ink-muted">Or type the details below.</p>

              <div className="mt-2 space-y-3">
                <Field label="Contact name" value={form.name} autoComplete="name"
                  onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
                <Field label="Company" value={form.company} autoComplete="organization"
                  onChange={(v) => setForm((f) => ({ ...f, company: v }))} />
                {chosen.index === OTHER_SEAT ? (
                  <Field label="Category" hint="e.g. Plumber, Dentist" value={form.category}
                    onChange={(v) => setForm((f) => ({ ...f, category: v }))} />
                ) : null}
                <Field label="Phone" hint="optional" type="tel" inputMode="tel" autoComplete="tel"
                  value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
                <Field label="Email" hint="optional" type="email" inputMode="email" autoComplete="email"
                  value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
              </div>

              <AnimatePresence>
                {error ? (
                  <motion.p
                    role="alert"
                    initial={reduced ? false : { opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 rounded-xl bg-[#FDECEE] px-4 py-3 text-sm font-semibold text-[#A51A26]"
                  >
                    {error}
                  </motion.p>
                ) : null}
              </AnimatePresence>

              <motion.button
                type="button"
                onClick={submit}
                disabled={isPending}
                whileTap={reduced ? undefined : { scale: 0.98 }}
                className="mt-5 w-full rounded-2xl bg-bni py-4 text-lg font-bold text-white disabled:opacity-70"
              >
                {isPending ? "Adding…" : "Add contact"}
              </motion.button>
              <button
                type="button"
                onClick={() => setChosen(null)}
                className="mt-3 w-full py-3 text-sm text-muted underline"
              >
                Back to all seats
              </button>
            </Step>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 70 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 70 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="fixed inset-x-4 bottom-5 z-40 flex items-center justify-between rounded-2xl bg-[#1F7A3E] px-5 py-4 font-bold text-white shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6)]"
          >
            <span className="text-base">{toast.text}</span>
            <span className="text-2xl">+{toast.points}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/**
 * One step of the member flow.
 *
 * `AnimatePresence` deliberately runs without `mode="wait"`: the team is read
 * from localStorage, so the key changes on the very first client render and a
 * waiting exit never completes, leaving the page blank. Exit is instant
 * instead, which also stops the outgoing and incoming steps sharing layout.
 */
function Step({ children, reduced }: { children: React.ReactNode; reduced: boolean }) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, transition: { duration: 0 } }}
      transition={{ type: "spring", stiffness: 460, damping: 38 }}
    >
      {children}
    </motion.div>
  );
}

function OutsideBniNote({ compact = false }: { compact?: boolean }) {
  return (
    <p
      className={`${compact ? "mt-3" : "mt-4"} rounded-xl border-2 border-bni bg-[#FDECEE] px-4 py-2.5 text-sm font-bold text-[#A51A26]`}
    >
      People outside BNI only. Please don&rsquo;t add members of Dabbers or any other BNI chapter.
    </p>
  );
}

/**
 * Who this phone belongs to, plus the way out if either is wrong.
 *
 * Moving team is deliberately a two-step with a nudge to speak to Harry
 * first: teams need to stay roughly even, and he is standing right there.
 * The nudge is social rather than enforced — blocking it in software would
 * just mean someone sitting on the wrong team all session.
 */
function TeamChip({
  identity,
  moving,
  pending,
  reduced,
  onNotYou,
  onMove,
  onPickTeam,
}: {
  identity: { name: string; team: TeamId } | null;
  moving: boolean;
  pending: boolean;
  reduced: boolean;
  onNotYou: () => void;
  onMove: () => void;
  onPickTeam: (team: TeamId) => void;
}) {
  const t = identity ? getTeam(identity.team) : null;
  if (!identity || !t) return null;

  return (
    <div className="rounded-xl bg-surface-muted px-4 py-2.5 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate font-bold text-foreground">{identity.name}</span>
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: t.accent }} />
            {t.name}
          </span>
        </span>
        <span className="flex shrink-0 gap-3">
          <button type="button" onClick={onMove} className="text-xs text-muted underline">
            {moving ? "Cancel" : "Move team"}
          </button>
          <button type="button" onClick={onNotYou} className="text-xs text-muted underline">
            Not you?
          </button>
        </span>
      </div>

      {moving ? (
        <motion.div
          initial={reduced ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="overflow-hidden"
        >
          <p className="mt-3 rounded-lg border border-[#C9A227] bg-[#FFFBEF] px-3 py-2 text-xs font-semibold text-foreground">
            Have a quick word with Harry before you move — he&rsquo;s keeping the teams
            even.
          </p>
          <div className="mt-2 grid gap-1.5">
            {TEAMS.filter((team) => team.id !== identity.team).map((team) => (
              <button
                key={team.id}
                type="button"
                disabled={pending}
                onClick={() => onPickTeam(team.id)}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-bold text-white disabled:opacity-60"
                style={{ background: team.accent }}
              >
                {team.name}
                <span className="text-[11px] font-semibold opacity-85">Move here</span>
              </button>
            ))}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

function HoldingScreen({
  state,
  points,
  round1Seconds,
}: {
  state: WorkshopSnapshot["state"];
  points: number;
  round1Seconds: number;
}) {
  const copy = {
    waiting: ["Get ready", "Round 1 starts in a moment. Have your phone contacts handy."],
    break: ["Time's up!", "Look at the big screen. Round 2 opens all 20 seats to everyone."],
    ended: ["Thank you!", "Every contact you added is on the list for a visitor invitation."],
    slide1: ["Thank you!", "Every contact you added is on the list for a visitor invitation."],
    slide2: ["Thank you!", "Every contact you added is on the list for a visitor invitation."],
    round1: ["", ""],
    round2: ["", ""],
  }[state];

  const display =
    state === "waiting" ? formatClock(round1Seconds) : state === "break" ? "0:00" : "✓";

  return (
    <div className="mt-10 text-center">
      <p className="text-6xl font-extrabold text-bni">{display}</p>
      <h2 className="mt-4 text-xl font-bold text-foreground">{copy[0]}</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted">{copy[1]}</p>
      <p className="mt-6 text-sm text-muted">
        Your team has <strong className="text-foreground">{points}</strong>{" "}
        {points === 1 ? "point" : "points"}.
      </p>
    </div>
  );
}

function SeatList({
  snapshot,
  myTeam,
  allTeams,
  justFilled,
  reduced,
  onPick,
}: {
  snapshot: WorkshopSnapshot;
  myTeam: TeamId;
  allTeams: boolean;
  justFilled: string | null;
  reduced: boolean;
  onPick: (pick: Chosen) => void;
}) {
  const teams = allTeams ? TEAMS : TEAMS.filter((t) => t.id === myTeam);

  return (
    <div className="mt-4 space-y-5">
      {teams.map((t) => (
        <div key={t.id}>
          {allTeams ? (
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">
              {t.name}
            </p>
          ) : null}
          <div className="space-y-2">
            {t.seats.map((seat, index) => {
              const count = snapshot.seats[t.id]?.[index] ?? 0;
              const full = count >= NAMES_PER_SEAT;
              const key = `${t.id}:${index}`;
              return (
                <motion.button
                  key={key}
                  type="button"
                  onClick={() => onPick({ team: t.id, index })}
                  whileTap={reduced ? undefined : { scale: 0.98 }}
                  animate={
                    justFilled === key && !reduced
                      ? { scale: [1, 1.03, 1], transition: { duration: 0.45 } }
                      : {}
                  }
                  className={`flex min-h-[3rem] w-full items-center justify-between gap-3 rounded-xl border-2 bg-white px-4 py-3 text-left ${
                    justFilled === key ? "border-bni bg-[#FDF1F2]" : "border-border"
                  }`}
                >
                  <span className="text-[15px] font-medium text-foreground">{seat}</span>
                  {full ? (
                    <span className="shrink-0 rounded-full bg-bni px-2.5 py-1 text-[11px] font-extrabold text-white">
                      3× POINTS
                    </span>
                  ) : (
                    <Pips count={count} reduced={reduced} />
                  )}
                </motion.button>
              );
            })}
            <button
              type="button"
              onClick={() => onPick({ team: t.id, index: OTHER_SEAT })}
              className="flex min-h-[3rem] w-full items-center justify-between gap-3 rounded-xl border-2 border-dashed border-border bg-white px-4 py-3 text-left"
            >
              <span>
                <span className="text-[15px] font-medium text-foreground">
                  Other {allTeams ? `${t.name} ` : ""}contact
                </span>
                <span className="block text-xs text-muted">
                  Someone useful outside these seats. You&rsquo;ll add their category.
                </span>
              </span>
              <span className="shrink-0 text-[11px] font-bold text-ink-muted">1 PT</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Pips({ count, reduced }: { count: number; reduced: boolean }) {
  return (
    <span className="flex shrink-0 gap-1">
      {Array.from({ length: NAMES_PER_SEAT }, (_, i) => (
        <motion.i
          key={i}
          animate={{ scale: i < count ? 1 : 0.82 }}
          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 24, delay: i * 0.04 }}
          className={`block h-2.5 w-2.5 rounded-full border-2 border-[#C9A227] ${i < count ? "bg-[#C9A227]" : ""}`}
        />
      ))}
    </span>
  );
}

function ChosenSeat({
  chosen,
  snapshot,
  onBack,
}: {
  chosen: Chosen;
  snapshot: WorkshopSnapshot;
  onBack: () => void;
}) {
  const team = getTeam(chosen.team);
  const isOther = chosen.index === OTHER_SEAT;
  const name = isOther ? `Other ${team?.name} contact` : (team?.seats[chosen.index] ?? "");
  const count = isOther ? 0 : (snapshot.seats[chosen.team]?.[chosen.index] ?? 0);
  const full = count >= NAMES_PER_SEAT;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-bni bg-[#FDF1F2] px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs text-muted">Step 2: adding someone for</p>
        <p className="truncate text-lg font-bold text-foreground">{name}</p>
        <p className="text-xs text-muted">
          {isOther
            ? "Scores 1 point. Tell us their category below."
            : full
              ? "Seat full — this contact scores triple points"
              : `${count} of ${NAMES_PER_SEAT} names so far`}
        </p>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="shrink-0 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold"
      >
        Change
      </button>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  type = "text",
  inputMode,
  autoComplete,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: "tel" | "email" | "text";
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-foreground">
        {label}
        {hint ? <em className="ml-1 font-normal not-italic text-muted">({hint})</em> : null}
      </span>
      <input
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border-[1.5px] border-[#BDBDC1] bg-white px-3 py-3 text-base outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/25"
      />
    </label>
  );
}
