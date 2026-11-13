"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { MembersSlide, NetworkSlide } from "@/components/workshop/slides";
import { Odometer } from "@/components/workshop/odometer";
import { formatClock, useSnapshot } from "@/components/workshop/use-snapshot";
import {
  NAMES_PER_SEAT,
  TEAMS,
  TEAM_TARGET,
  getTeam,
  type WorkshopConstants,
} from "@/lib/workshop/config";
import type { WorkshopSnapshot } from "@/lib/workshop/snapshot";

const POLL_MS = 1000;

type BoardProps = {
  initial: WorkshopSnapshot;
  joinUrl: string;
  chapterLogoUrl: string | null;
  constants: WorkshopConstants;
};

export function Board({ initial, joinUrl, chapterLogoUrl, constants }: BoardProps) {
  const reduced = useReducedMotion() ?? false;
  const { snapshot, secondsLeft } = useSnapshot(initial, POLL_MS);
  const [milestone, setMilestone] = useState(false);
  const lastMilestone = useRef(initial.milestones);

  // Every tenth contact gets a celebration that never reveals the running total.
  useEffect(() => {
    if (snapshot.milestones <= lastMilestone.current) {
      lastMilestone.current = snapshot.milestones;
      return;
    }
    lastMilestone.current = snapshot.milestones;
    setMilestone(true);
    const id = setTimeout(() => setMilestone(false), 2800);
    return () => clearTimeout(id);
  }, [snapshot.milestones]);

  const leaderPoints = Math.max(...TEAMS.map((t) => snapshot.points[t.id] ?? 0));
  const roundOpen = snapshot.state === "round1" || snapshot.state === "round2";
  const latest = snapshot.recent[0];

  const roundLabel = {
    waiting: "Round 1 · own team seats",
    round1: "Round 1 · own team seats",
    break: "Next: round 2 · any seat",
    round2: "Round 2 · any seat",
    ended: "Final scores",
    slide1: "Final scores",
    slide2: "Final scores",
  }[snapshot.state];

  const displayClock = roundOpen
    ? formatClock(secondsLeft)
    : snapshot.state === "waiting"
      ? formatClock(snapshot.round1Seconds)
      : snapshot.state === "break"
        ? formatClock(snapshot.round2Seconds)
        : "0:00";

  return (
    <div className="workshop-board">
      <div className="workshop-board-rule" />

      <header className="workshop-board-head">
        <div className="min-w-0">
          <div className="flex items-center gap-[1.6cqi]">
            {chapterLogoUrl ? (
              <Image
                src={chapterLogoUrl}
                alt="BNI Dabbers"
                width={1350}
                height={480}
                className="h-[3.4cqi] w-auto"
                priority
                unoptimized
              />
            ) : (
              <span className="workshop-board-brand">BNI DABBERS</span>
            )}
            <span className="workshop-board-brand">GROWTH WORKSHOP</span>
          </div>
          <h1 className="workshop-board-title">Fill the key seats</h1>
          <p className="workshop-board-pill">
            Seat full? Keep going: every extra name scores <b>TRIPLE POINTS</b>
            <span className="opacity-60"> · </span>People outside BNI only
          </p>
        </div>

        <div className="text-right">
          <p className="workshop-board-round">{roundLabel}</p>
          <p
            className={`workshop-board-clock ${
              roundOpen && secondsLeft !== null && secondsLeft <= 30 ? "text-bni" : ""
            }`}
          >
            {displayClock}
          </p>
        </div>
      </header>

      <div className="workshop-board-cols">
        {TEAMS.map((team) => {
          const seats = snapshot.seats[team.id] ?? [0, 0, 0, 0, 0];
          const filled = seats.reduce((a, b) => a + b, 0);
          const points = snapshot.points[team.id] ?? 0;
          const leads = leaderPoints > 0 && points === leaderPoints;
          const allFull = seats.every((n) => n >= NAMES_PER_SEAT);

          return (
            <div
              key={team.id}
              className="workshop-board-col"
              style={{
                background: team.surface,
                color: team.accent,
                borderColor: team.outlined ? team.accent : "transparent",
              }}
            >
              {leads ? (
                <motion.span
                  // One shared element, so the gold ring slides between columns
                  // as the lead changes rather than blinking on and off.
                  layoutId="board-leader"
                  className="workshop-board-leader"
                  transition={
                    reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30 }
                  }
                />
              ) : null}

              <h2 className="workshop-board-team">{team.name}</h2>

              <div className="flex items-baseline justify-between">
                <Odometer value={points} className="workshop-board-points" />
                <span className="workshop-board-points-label">points</span>
              </div>

              <div className="workshop-board-bar">
                <motion.b
                  animate={{ width: `${(filled / TEAM_TARGET) * 100}%` }}
                  transition={
                    reduced ? { duration: 0 } : { type: "spring", stiffness: 160, damping: 26 }
                  }
                  style={{ background: "currentColor" }}
                />
              </div>
              <p className="workshop-board-progress">
                {filled} / {TEAM_TARGET} seats filled
              </p>

              <div className="workshop-board-slots">
                {team.seats.map((seat, index) => {
                  const count = seats[index] ?? 0;
                  const full = count >= NAMES_PER_SEAT;
                  const justLanded =
                    latest?.seatTeam === team.id && latest?.seatIndex === index;

                  return (
                    <motion.div
                      key={seat}
                      className={`workshop-board-slot ${full ? "is-full" : ""}`}
                      animate={
                        justLanded && !reduced
                          ? { scale: [1, 1.045, 1] }
                          : { scale: 1 }
                      }
                      transition={{ duration: 0.45 }}
                    >
                      <span>{seat}</span>
                      {full ? (
                        <span className="workshop-board-triple">3× POINTS</span>
                      ) : (
                        <span className="workshop-board-pips">
                          {Array.from({ length: NAMES_PER_SEAT }, (_, i) => (
                            <motion.i
                              key={i}
                              animate={{ scale: i < count ? 1 : 0.78 }}
                              transition={
                                reduced
                                  ? { duration: 0 }
                                  : { type: "spring", stiffness: 420, damping: 22 }
                              }
                              className={i < count ? "is-on" : ""}
                            />
                          ))}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {allFull ? (
                <p className="workshop-board-allfull">
                  Every seat full: all extra names score 3× points
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="workshop-board-ticker">
        <span className="workshop-board-ticker-key">JUST ADDED</span>
        <AnimatePresence initial={false}>
          {snapshot.recent.map((item) => (
            <motion.span
              key={item.id}
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, x: -18, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="workshop-board-chip"
            >
              <b>{item.category}</b> · {getTeam(item.byTeam)?.name} +{item.points}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <BoardOverlay
        snapshot={snapshot}
        joinUrl={joinUrl}
        reduced={reduced}
        leaderPoints={leaderPoints}
      />

      {snapshot.state === "slide1" ? (
        <NetworkSlide contacts={snapshot.totalContacts ?? 0} constants={constants} />
      ) : null}
      {snapshot.state === "slide2" ? (
        <MembersSlide contacts={snapshot.totalContacts ?? 0} constants={constants} />
      ) : null}

      <AnimatePresence>
        {milestone ? <Milestone reduced={reduced} /> : null}
      </AnimatePresence>
    </div>
  );
}

function BoardOverlay({
  snapshot,
  joinUrl,
  reduced,
  leaderPoints,
}: {
  snapshot: WorkshopSnapshot;
  joinUrl: string;
  reduced: boolean;
  leaderPoints: number;
}) {
  const show =
    snapshot.state === "waiting" ||
    snapshot.state === "break" ||
    snapshot.state === "ended";
  if (!show) return null;

  const ended = snapshot.state === "ended";
  const winner = TEAMS.slice().sort(
    (a, b) => (snapshot.points[b.id] ?? 0) - (snapshot.points[a.id] ?? 0),
  )[0];

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      className="workshop-board-overlay"
    >
      {snapshot.state === "waiting" ? (
        <Lobby snapshot={snapshot} joinUrl={joinUrl} reduced={reduced} />
      ) : snapshot.state === "break" ? (
        <>
          <h2>Round 2: any seat</h2>
          <p>
            All 20 seats are now open to everyone. Fill the gaps for other teams. Seats
            that are already full score triple points.
          </p>
        </>
      ) : ended ? (
        <>
          <Odometer
            value={snapshot.totalContacts ?? 0}
            className="workshop-board-total"
          />
          <p className="workshop-board-total-label">potential new visitors to invite</p>
          <h2>
            {winner?.name} win with {leaderPoints} points
          </h2>
          <p>
            {TEAMS.map((t) => `${t.name} ${snapshot.points[t.id] ?? 0}`).join("  ·  ")}
          </p>
        </>
      ) : null}
    </motion.div>
  );
}

function Milestone({ reduced }: { reduced: boolean }) {
  const pieces = Array.from({ length: 70 }, (_, i) => i);
  const colours = ["#CF2030", "#C9A227", "#64666A", "#1F7A3E", "#ffffff"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="workshop-board-milestone"
    >
      <motion.div
        initial={reduced ? false : { scale: 0, rotate: -6 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
        className="workshop-board-milestone-card"
      >
        <b>Another 10 contacts in!</b>
        <span>Keep going</span>
      </motion.div>
      {!reduced
        ? pieces.map((i) => (
            <i
              key={i}
              className="workshop-board-milestone-piece"
              style={{
                left: `${(i * 1.7 + (i % 7) * 5) % 100}%`,
                background: colours[i % colours.length],
                animationDelay: `${(i % 9) * 0.06}s`,
              }}
            />
          ))
        : null}
    </motion.div>
  );
}

/**
 * The holding screen before kick-off.
 *
 * The joined list is the point: Harry needs to see the room signing in so he
 * knows when to start, rather than guessing from a show of hands.
 */
function Lobby({
  snapshot,
  joinUrl,
  reduced,
}: {
  snapshot: WorkshopSnapshot;
  joinUrl: string;
  reduced: boolean;
}) {
  const joined = snapshot.participants;

  return (
    <div className="workshop-lobby">
      <div className="workshop-lobby-left">
        <div className="workshop-board-qr">
          <QRCode value={joinUrl} size={256} style={{ width: "100%", height: "100%" }} />
        </div>
        <h2>Scan to join</h2>
        <p>
          Find your name, then add the people you know for your team&rsquo;s key seats.
          People outside BNI only.
        </p>
        <p className="workshop-board-url">{joinUrl.replace("https://", "")}</p>
      </div>

      <div className="workshop-lobby-right">
        <div className="workshop-lobby-head">
          <span className="workshop-lobby-count">
            <Odometer value={joined.length} />
          </span>
          <span className="workshop-lobby-label">
            {joined.length === 1 ? "member is in" : "members are in"}
          </span>
        </div>

        {joined.length === 0 ? (
          <p className="workshop-lobby-empty">
            Nobody has scanned yet. Names appear here as they join.
          </p>
        ) : (
          <div className="workshop-lobby-teams">
            {TEAMS.map((team) => {
              const mine = joined.filter((p) => p.team === team.id);
              return (
                <div key={team.id} className="workshop-lobby-team">
                  <p className="workshop-lobby-team-head" style={{ color: team.accent }}>
                    <span className="workshop-lobby-team-name">{team.name}</span>
                    <span className="workshop-lobby-team-count">{mine.length}</span>
                  </p>
                  <ul>
                    <AnimatePresence initial={false}>
                      {mine.map((person) => (
                        <motion.li
                          key={person.name}
                          layout={!reduced}
                          initial={reduced ? false : { opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, transition: { duration: 0.12 } }}
                          transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        >
                          {person.name}
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
