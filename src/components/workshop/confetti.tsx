"use client";

import { useState } from "react";

const COLOURS = ["#CF2030", "#C9A227", "#64666A", "#1F7A3E"];
const PIECES = Array.from({ length: 36 }, (_, i) => i);

/**
 * A short confetti burst. Plain DOM over canvas so it stays cheap on a room
 * full of mid-range phones, and skipped entirely under reduced motion.
 *
 * Pieces are derived from `fireKey` during render and cleared by the animation
 * ending, so no effect has to schedule an extra render to show or hide them.
 */
export function Confetti({ fireKey, reduced }: { fireKey: number; reduced: boolean }) {
  const [finishedKey, setFinishedKey] = useState(0);
  const active = fireKey > 0 && fireKey !== finishedKey && !reduced;

  if (!active) return null;

  return (
    <div
      key={fireKey}
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden="true"
      onAnimationEnd={() => setFinishedKey(fireKey)}
    >
      {PIECES.map((i) => (
        <i
          key={i}
          className="workshop-confetti-piece"
          style={{
            left: `${(i * 2.8 + (i % 5) * 4) % 100}%`,
            background: COLOURS[i % COLOURS.length],
            animationDelay: `${(i % 7) * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}
