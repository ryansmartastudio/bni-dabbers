"use client";

import { useEffect } from "react";

/**
 * Forward and back for whoever is driving the projector.
 *
 * Covers presentation clickers as well as a keyboard: most of them send
 * PageDown/PageUp or the arrow keys, so the same handler works whether Harry
 * is at the laptop or stood at the front with a remote.
 */
const FORWARD = new Set(["ArrowRight", "ArrowDown", "PageDown", " ", "Spacebar", "Enter"]);
const BACK = new Set(["ArrowLeft", "ArrowUp", "PageUp", "Backspace"]);

export function useBoardKeys({
  enabled,
  onForward,
  onBack,
}: {
  enabled: boolean;
  onForward: () => void;
  onBack: () => void;
}) {
  useEffect(() => {
    if (!enabled) return;

    function handle(event: KeyboardEvent) {
      // Never steal keys from a field, in case the board is open next to admin.
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (FORWARD.has(event.key)) {
        event.preventDefault();
        onForward();
      } else if (BACK.has(event.key)) {
        event.preventDefault();
        onBack();
      }
    }

    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [enabled, onForward, onBack]);
}
