"use client";

import { motion, useReducedMotion } from "motion/react";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * A counter whose digits roll rather than swap.
 *
 * Every number on the board uses this so a score ticking up reads as movement
 * from the back of the room, where a plain text swap is easy to miss.
 */
export function Odometer({
  value,
  className,
  prefix,
}: {
  value: number;
  className?: string;
  prefix?: string;
}) {
  const reduced = useReducedMotion() ?? false;
  const digits = String(Math.max(0, Math.round(value))).split("");

  if (reduced) {
    return (
      <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
        {prefix}
        {digits.join("")}
      </span>
    );
  }

  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "baseline" }}>
      {prefix ? <span>{prefix}</span> : null}
      {digits.map((digit, index) => (
        <span
          // Keyed by position from the right so adding a digit doesn't reshuffle
          // the ones already settled.
          key={`${digits.length - index}`}
          className="workshop-odo-window"
        >
          <motion.span
            className="workshop-odo-strip"
            animate={{ y: `${Number(digit) * -10}%` }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
          >
            {DIGITS.map((n) => (
              <span key={n} className="workshop-odo-cell">
                {n}
              </span>
            ))}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
