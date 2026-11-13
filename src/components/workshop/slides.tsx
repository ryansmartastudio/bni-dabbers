"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { NetworkWeb } from "@/components/workshop/network-web";
import { Odometer } from "@/components/workshop/odometer";
import type { WorkshopConstants } from "@/lib/workshop/config";
import {
  connections,
  formatCount,
  formatMoney,
  projectMemberValue,
  projectNetwork,
} from "@/lib/workshop/projections";

/** Slide 1 — how today's list grows the network. */
export function NetworkSlide({
  contacts,
  constants,
  revealed,
}: {
  contacts: number;
  constants: WorkshopConstants;
  /** 1 contacts · 2 visitors · 3 new members · 4 the web grows · 5 the law. */
  revealed: number;
}) {
  const reduced = useReducedMotion() ?? false;
  const p = projectNetwork(contacts, constants);
  const [liveMembers, setLiveMembers] = useState(p.membersToday);

  const liveConnections = connections(Math.round(liveMembers));
  const growth =
    p.connectionsToday === 0
      ? 0
      : ((liveConnections - p.connectionsToday) / p.connectionsToday) * 100;

  const steps = [
    { value: p.contacts, label: "contacts listed today" },
    { value: p.visitors, label: "visitors in the room" },
    { value: p.newMembers, label: "new members" },
  ];
  const arrows = [
    `${Math.round(constants.visitorRate * 100)}% come along as visitors`,
    `${(constants.conversionRate * 100).toFixed(1)}% join, our actual conversion rate`,
  ];

  return (
    <div className="workshop-slide">
      <div className="workshop-slide-left">
        <p className="workshop-board-brand">BNI DABBERS · WHY WE GROW</p>
        <h2 className="workshop-slide-title">How today&rsquo;s list grows our network</h2>

        {steps.slice(0, Math.max(0, revealed)).map((step, index) => (
          <div key={step.label}>
            {index > 0 ? (
              <motion.p
                className="workshop-slide-arrow"
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduced ? 0 : 0.35 }}
              >
                {arrows[index - 1]}
              </motion.p>
            ) : null}
            <motion.div
              className="workshop-slide-step"
              initial={reduced ? false : { opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
            >
              <CountUp to={step.value} delay={0} />
              <span className="workshop-slide-step-label">{step.label}</span>
            </motion.div>
          </div>
        ))}

        <motion.div
          className="workshop-slide-step is-total"
          initial={reduced ? false : { opacity: 0, x: -24 }}
          animate={{
            opacity: revealed >= 4 ? 1 : 0,
            x: revealed >= 4 ? 0 : -24,
          }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
        >
          <b className="workshop-slide-step-value">{Math.round(liveMembers)}</b>
          <span className="workshop-slide-step-label">
            members
            <span className="workshop-slide-step-sub">
              {formatCount(liveConnections)} connections, up from{" "}
              {formatCount(p.connectionsToday)} ({growth >= 0 ? "+" : ""}
              {Math.round(growth)}%)
            </span>
          </span>
        </motion.div>
      </div>

      <div className="workshop-slide-right">
        <NetworkWeb
          membersToday={p.membersToday}
          newMembers={p.newMembers}
          reduced={reduced}
          active={revealed >= 4}
          onProgress={setLiveMembers}
        />
        <div className="workshop-slide-legend">
          <span>
            <i /> Today&rsquo;s {p.membersToday} members
          </span>
          <span>
            <i className="is-new" /> New members
          </span>
        </div>
        <motion.p
          className="workshop-slide-foot"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: revealed >= 5 ? 1 : 0 }}
          transition={{ duration: reduced ? 0 : 0.4 }}
        >
          <b>Metcalfe&rsquo;s Law:</b> a network&rsquo;s value grows with the connections
          between its members, n × (n − 1) ÷ 2. Each new member connects to every one of
          us, so our network grows faster than our head count.
        </motion.p>
      </div>
    </div>
  );
}

/** Slide 2 — what that growth is worth to each member. */
export function MembersSlide({
  contacts,
  constants,
  revealed,
}: {
  contacts: number;
  constants: WorkshopConstants;
  /** How many cards to show. Harry advances these one at a time. */
  revealed: number;
}) {
  const reduced = useReducedMotion() ?? false;
  const { membersAfter, rows } = projectMemberValue(contacts, constants);
  const visible = rows.slice(0, Math.max(0, revealed));

  return (
    <div className="workshop-members-slide">
      <p className="workshop-board-brand">
        BNI DABBERS · WHAT OUR GROWTH MEANS FOR MEMBERS
      </p>
      <h2 className="workshop-members-title">
        With <span>{membersAfter}</span> members, every year we could see…
      </h2>

      <div className="workshop-member-cards" data-count={rows.length}>
        {visible.map((row) => {
          const format = row.money ? formatMoney : formatCount;
          const max = Math.max(row.after, row.today) * 1.05 || 1;
          // Each card animates when it arrives, not on a shared timeline, so
          // the one Harry just revealed is the one that moves.
          const delay = 0;

          return (
            <motion.div
              key={row.key}
              className={`workshop-member-card ${row.money ? "is-headline" : ""}`}
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay, type: "spring", stiffness: 260, damping: 28 }}
            >
              <span className="workshop-member-label">{row.label}</span>
              <CountUp
                to={row.after}
                from={row.today}
                delay={delay + 0.3}
                format={format}
                className="workshop-member-value"
              />
              <CountUp
                to={row.delta}
                delay={delay + 0.3}
                format={(v) => `+${format(v)} a year`}
                className="workshop-member-delta"
              />

              <div className="workshop-member-bars">
                <div>
                  <motion.i
                    className="is-today"
                    initial={{ width: 0 }}
                    animate={{ width: `${(row.today / max) * 100}%` }}
                    transition={{ delay: delay + 0.2, duration: reduced ? 0 : 1.2, ease: "easeOut" }}
                  />
                  <span>
                    Today, {constants.membersToday} members: <em>{format(row.today)}</em>
                  </span>
                </div>
                <div>
                  <motion.i
                    className="is-after"
                    initial={{ width: 0 }}
                    animate={{ width: `${(row.after / max) * 100}%` }}
                    transition={{ delay: delay + 0.4, duration: reduced ? 0 : 1.4, ease: "easeOut" }}
                  />
                  <span>With growth</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.p
        className="workshop-members-foot"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: revealed > rows.length ? 1 : 0 }}
        transition={{ duration: reduced ? 0 : 0.4 }}
      >
        <b>If we keep up our momentum.</b> Based on Dabbers PALMS for March to August
        2026: each member gave{" "}
        {constants.referralsGivenPerMemberMonth.toFixed(1)} referrals and received{" "}
        {constants.referralsReceivedPerMemberMonth.toFixed(1)} a month. TYFTB:{" "}
        {formatCount(constants.tyfcbLast12Months) === "0"
          ? "—"
          : `£${formatCount(constants.tyfcbLast12Months)}`}{" "}
        in the last 12 months, scaled up in line with member numbers.
      </motion.p>
    </div>
  );
}

/**
 * Counts from one figure to another once its delay has elapsed.
 *
 * Driven by a spring on a plain number rather than CSS, so the value the room
 * reads is always the value being animated.
 */
function CountUp({
  to,
  from = 0,
  delay,
  format,
  className,
}: {
  to: number;
  from?: number;
  delay: number;
  format?: (value: number) => string;
  className?: string;
}) {
  const reduced = useReducedMotion() ?? false;
  // Under reduced motion the final figure is the initial state, so nothing
  // has to be set from inside the effect.
  const [value, setValue] = useState(reduced ? to : from);

  useEffect(() => {
    if (reduced) return;

    let frame = 0;
    let cancelled = false;
    const started = performance.now() + delay * 1000;
    const duration = 1100;

    const tick = (now: number) => {
      if (cancelled) return;
      if (now < started) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (to - from) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [to, from, delay, reduced]);

  if (format) return <b className={className}>{format(value)}</b>;
  return <Odometer value={value} className={className ?? "workshop-slide-step-value"} />;
}
