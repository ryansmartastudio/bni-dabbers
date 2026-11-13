"use client";

import { useSyncExternalStore } from "react";
import { TEAMS, type TeamId } from "@/lib/workshop/config";

const STORAGE_KEY = "bni-workshop-identity";

export type Identity = { name: string; team: TeamId };

const listeners = new Set<() => void>();
let cached: Identity | null | undefined;

function read(): Identity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Identity>;
    if (!parsed?.name || !parsed?.team) return null;
    if (!TEAMS.some((t) => t.id === parsed.team)) return null;
    return { name: parsed.name, team: parsed.team };
  } catch {
    // Private browsing, or stale data from an earlier build.
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
function getSnapshot(): Identity | null {
  if (cached === undefined) cached = read();
  return cached;
}

function getServerSnapshot(): Identity | null {
  return null;
}

/**
 * Who this phone belongs to, remembered for the session.
 *
 * Held in an external store rather than state seeded from an effect: reading
 * localStorage during render would mismatch the server HTML, and setting state
 * inside an effect costs an extra render on every phone in the room.
 */
export function useStoredIdentity() {
  const identity = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function setIdentity(next: Identity | null) {
    cached = next;
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Not fatal — the choice just won't survive a reload.
    }
    for (const listener of listeners) listener();
  }

  return [identity, setIdentity] as const;
}
