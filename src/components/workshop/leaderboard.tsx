"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Odometer } from "@/components/workshop/odometer";
import { TEAMS, type TeamId } from "@/lib/workshop/config";

type Standing = {
  id: TeamId;
  name: string;
  accent: string;
  points: number;
  /** Shared by teams level on points. */
  rank: number;
};

const ORDINAL = ["1st", "2nd", "3rd", "4th"];

function standings(points: Record<TeamId, number>): Standing[] {
  const ranked = TEAMS.map((team) => ({
    id: team.id,
    name: team.name,
    accent: team.accent,
    points: points[team.id] ?? 0,
    rank: 0,
  })).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "en-GB"));

  let rank = 0;
  let previous: number | null = null;
  return ranked.map((row, index) => {
    if (previous === null || row.points !== previous) rank = index + 1;
    previous = row.points;
    return { ...row, rank };
  });
}

/**
 * The final standings.
 *
 * Rows come up in team order and only then sort themselves into rank, so the
 * room watches the result settle rather than being handed it. The winner is
 * held back until the reorder lands.
 */
export function Leaderboard({
  points,
  reduced,
}: {
  points: Record<TeamId, number>;
  reduced: boolean;
}) {
  // listing -> ranked -> crowned
  const [phase, setPhase] = useState<"listing" | "ranked" | "crowned">(
    reduced ? "crowned" : "listing",
  );

  useEffect(() => {
    if (reduced) return;
    const toRanked = setTimeout(() => setPhase("ranked"), 1400);
    const toCrowned = setTimeout(() => setPhase("crowned"), 2600);
    return () => {
      clearTimeout(toRanked);
      clearTimeout(toCrowned);
    };
  }, [reduced]);

  const ranked = standings(points);
  const rows = phase === "listing" ? TEAMS.map((t) => ranked.find((r) => r.id === t.id)!) : ranked;
  const top = ranked[0];
  const max = Math.max(1, ...ranked.map((row) => row.points));
  const winners = ranked.filter((row) => row.rank === 1);
  const crowned = phase === "crowned";

  return (
    <div className="workshop-leaderboard">
      {rows.map((row, index) => {
        const isWinner = crowned && row.rank === 1;
        return (
          <motion.div
            key={row.id}
            layout={!reduced}
            initial={reduced ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              layout: { type: "spring", stiffness: 260, damping: 30 },
              delay: reduced ? 0 : index * 0.12,
              type: "spring",
              stiffness: 320,
              damping: 30,
            }}
            className={`workshop-lb-row ${isWinner ? "is-winner" : ""}`}
          >
            <motion.span layout={!reduced} className="workshop-lb-rank">
              {crowned || phase === "ranked" ? ORDINAL[row.rank - 1] : "—"}
            </motion.span>

            <motion.span layout={!reduced} className="workshop-lb-name">
              {row.name}
              {isWinner ? <Crown /> : null}
            </motion.span>

            <motion.span layout={!reduced} className="workshop-lb-bar">
              <motion.i
                initial={{ width: 0 }}
                animate={{ width: `${(row.points / max) * 100}%` }}
                transition={{
                  delay: reduced ? 0 : 0.3 + index * 0.12,
                  duration: reduced ? 0 : 0.9,
                  ease: "easeOut",
                }}
                style={{ background: row.accent }}
              />
            </motion.span>

            <motion.span layout={!reduced} className="workshop-lb-points">
              <Odometer value={row.points} />
            </motion.span>
          </motion.div>
        );
      })}

      <AnimatePresence>
        {crowned && top ? (
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="workshop-lb-verdict"
          >
            {winners.length > 1
              ? `${winners.map((w) => w.name).join(" and ")} tie on ${top.points} points`
              : `${top.name} win with ${top.points} points`}
          </motion.p>
        ) : null}
      </AnimatePresence>

      {crowned && !reduced ? <WinnerConfetti /> : null}
    </div>
  );
}

function Crown() {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="workshop-lb-crown"
      aria-hidden="true"
      initial={{ scale: 0, rotate: -25 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.15 }}
    >
      <path
        d="M3 18h18l1.2-9.4-5.1 3.3L12 4 6.9 11.9 1.8 8.6 3 18Z"
        fill="#C9A227"
        stroke="#A8871F"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <rect x="3" y="19" width="18" height="2.4" rx="1" fill="#C9A227" />
    </motion.svg>
  );
}

function WinnerConfetti() {
  const pieces = Array.from({ length: 54 }, (_, i) => i);
  const colours = ["#C9A227", "#CF2030", "#ffffff", "#8E1520"];
  return (
    <div className="workshop-lb-confetti" aria-hidden="true">
      {pieces.map((i) => (
        <i
          key={i}
          style={{
            left: `${(i * 1.9 + (i % 6) * 4) % 100}%`,
            background: colours[i % colours.length],
            animationDelay: `${(i % 8) * 0.07}s`,
          }}
        />
      ))}
    </div>
  );
}
