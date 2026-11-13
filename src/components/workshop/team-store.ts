"use client";

import { useSyncExternalStore } from "react";
import { TEAMS, type TeamId } from "@/lib/workshop/config";

const STORAGE_KEY = "bni-workshop-team";

const listeners = new Set<() => void>();
let cached: TeamId | null | undefined;

function read(): TeamId | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && TEAMS.some((t) => t.id === saved) ? (saved as TeamId) : null;
  } catch {
    // Private browsing — they simply pick again.
    return null;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Cached so the snapshot is referentially stable between renders. */
function getSnapshot(): TeamId | null {
  if (cached === undefined) cached = read();
  return cached;
}

function getServerSnapshot(): TeamId | null {
  return null;
}

/**
 * The team choice is made once and remembered for the session.
 *
 * Held in an external store rather than state seeded from an effect: reading
 * localStorage during render would mismatch the server HTML, and setting state
 * inside an effect costs an extra render on every phone in the room.
 */
export function useStoredTeam() {
  const team = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function setTeam(next: TeamId | null) {
    cached = next;
    try {
      if (next) localStorage.setItem(STORAGE_KEY, next);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Not fatal — the choice just won't survive a reload.
    }
    for (const listener of listeners) listener();
  }

  return [team, setTeam] as const;
}
