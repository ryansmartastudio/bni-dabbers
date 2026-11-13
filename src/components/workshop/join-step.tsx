"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { TEAMS } from "@/lib/workshop/config";
import { getTeam, type TeamId } from "@/lib/workshop/config";
import { normaliseText } from "@/lib/workshop/normalise";
import type { RosterMember } from "@/lib/workshop/roster";

type JoinStepProps = {
  roster: RosterMember[];
  reduced: boolean;
  pending: boolean;
  error: string | null;
  onJoin: (name: string, team: TeamId) => void;
  onJoinAsGuest: (name: string, company: string, team: TeamId) => void;
};

/**
 * "Who are you?" — the first thing a member sees after scanning.
 *
 * Picking a name rather than a team means the power team comes from Harry's
 * Growth Plan instead of memory, and the board can show Harry who is actually
 * in the room before he starts.
 */
export function JoinStep({
  roster,
  reduced,
  pending,
  error,
  onJoin,
  onJoinAsGuest,
}: JoinStepProps) {
  const [query, setQuery] = useState("");
  const [guest, setGuest] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestCompany, setGuestCompany] = useState("");
  const [guestTeam, setGuestTeam] = useState<TeamId | null>(null);

  const matches = useMemo(() => {
    const q = normaliseText(query);
    if (!q) return roster;
    return roster.filter(
      (m) => normaliseText(m.name).includes(q) || normaliseText(m.seat).includes(q),
    );
  }, [roster, query]);

  function choose(member: RosterMember) {
    onJoin(member.name, member.team);
  }

  if (guest) {
    const ready = guestName.trim().length > 1 && guestCompany.trim().length > 1;
    return (
      <div>
        <h2 className="text-xl font-bold text-foreground">Visiting today?</h2>
        <p className="mt-1 text-sm text-muted">
          Add yourself and join a power team — you can list contacts just like the
          members.
        </p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-foreground">
              Your name
            </span>
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              autoComplete="name"
              maxLength={40}
              className="w-full rounded-xl border-[1.5px] border-[#BDBDC1] bg-white px-3 py-3 text-base outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/25"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-foreground">
              Your company
            </span>
            <input
              value={guestCompany}
              onChange={(e) => setGuestCompany(e.target.value)}
              autoComplete="organization"
              maxLength={40}
              className="w-full rounded-xl border-[1.5px] border-[#BDBDC1] bg-white px-3 py-3 text-base outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/25"
            />
          </label>
        </div>

        <p className="mt-5 text-[13px] font-bold text-foreground">Pick a power team</p>
        <div className="mt-2 space-y-2">
          {TEAMS.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={pending}
              onClick={() => setGuestTeam(t.id)}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left text-base font-bold text-white transition disabled:opacity-60 ${
                guestTeam === t.id ? "ring-4 ring-[#C9A227]" : ""
              }`}
              style={{ background: t.accent }}
            >
              {t.name}
              {guestTeam === t.id ? <span className="text-xs">Selected</span> : null}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mt-3 rounded-xl bg-[#FDECEE] px-4 py-3 text-sm font-semibold text-[#A51A26]">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={pending || !ready || !guestTeam}
          onClick={() => guestTeam && onJoinAsGuest(guestName, guestCompany, guestTeam)}
          className="mt-5 w-full rounded-2xl bg-bni py-4 text-lg font-bold text-white disabled:opacity-50"
        >
          {pending ? "Joining…" : "Join the workshop"}
        </button>
        <button
          type="button"
          onClick={() => setGuest(false)}
          className="mt-3 w-full py-3 text-sm text-muted underline"
        >
          I&rsquo;m a Dabbers member
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground">Who are you?</h2>
      <p className="mt-1 text-sm text-muted">
        Find your name so we know you&rsquo;re here and which power team you&rsquo;re on.
      </p>

      <label className="mt-4 block">
        <span className="sr-only">Search for your name</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Start typing your name…"
          autoComplete="off"
          className="w-full rounded-xl border-[1.5px] border-[#BDBDC1] bg-white px-4 py-3.5 text-base outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/25"
        />
      </label>

      {error ? (
        <p className="mt-3 rounded-xl bg-[#FDECEE] px-4 py-3 text-sm font-semibold text-[#A51A26]">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setGuest(true)}
        className="mt-3 flex w-full items-center justify-between rounded-xl border-2 border-dashed border-[#C9A227] bg-[#FFFBEF] px-4 py-3.5 text-left"
      >
        <span>
          <span className="block text-[15px] font-bold text-foreground">
            Visiting today?
          </span>
          <span className="block text-xs text-muted">
            Not a Dabbers member — add yourself and join in
          </span>
        </span>
        <span className="shrink-0 text-lg font-bold text-bni">→</span>
      </button>

      <div className="mt-3 space-y-2">
        {matches.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-white px-4 py-6 text-center text-sm text-muted">
            No one matches &ldquo;{query}&rdquo;. Check the spelling, or ask Harry.
          </p>
        ) : (
          matches.map((member) => {
            const t = getTeam(member.team);
            return (
              <motion.button
                key={member.name}
                type="button"
                disabled={pending}
                onClick={() => choose(member)}
                whileTap={reduced ? undefined : { scale: 0.985 }}
                className="flex min-h-[3.25rem] w-full items-center justify-between gap-3 rounded-xl border-2 border-border bg-white px-4 py-3 text-left disabled:opacity-60"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold text-foreground">
                    {member.name}
                  </span>
                  {member.seat ? (
                    <span className="block truncate text-xs text-muted">{member.seat}</span>
                  ) : null}
                </span>
                {t ? (
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                    style={{ background: t.accent }}
                  >
                    {t.name}
                  </span>
                ) : null}
              </motion.button>
            );
          })
        )}
      </div>

      <p className="mt-4 text-center text-xs text-ink-muted">
        {roster.length} members in the chapter
      </p>
    </div>
  );
}
