"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { getTeam, type TeamId } from "@/lib/workshop/config";
import { normaliseText } from "@/lib/workshop/normalise";
import type { RosterMember } from "@/lib/workshop/roster";

type JoinStepProps = {
  roster: RosterMember[];
  reduced: boolean;
  pending: boolean;
  error: string | null;
  onJoin: (name: string, team: TeamId) => void;
};

/**
 * "Who are you?" — the first thing a member sees after scanning.
 *
 * Picking a name rather than a team means the power team comes from Harry's
 * Growth Plan instead of memory, and the board can show Harry who is actually
 * in the room before he starts.
 */
export function JoinStep({ roster, reduced, pending, error, onJoin }: JoinStepProps) {
  const [query, setQuery] = useState("");

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
