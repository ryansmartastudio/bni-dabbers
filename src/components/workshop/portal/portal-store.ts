"use client";

import { useSyncExternalStore } from "react";

const KEY = "bni-workshop-portal";

export type PortalSession = { password: string; memberName: string | null };

const listeners = new Set<() => void>();
let cached: PortalSession | null | undefined;

function read(): PortalSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PortalSession>;
    if (!parsed?.password) return null;
    return { password: parsed.password, memberName: parsed.memberName ?? null };
  } catch {
    return null;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): PortalSession | null {
  if (cached === undefined) cached = read();
  return cached;
}

function getServerSnapshot(): PortalSession | null {
  return null;
}

/**
 * Remembers the password and who you are between visits.
 *
 * Members will come back to this over the days after the workshop, and making
 * them re-enter a shared password each time is the quickest way to make a tool
 * go unused.
 */
export function usePortalSession() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function set(next: PortalSession | null) {
    cached = next;
    try {
      if (next) localStorage.setItem(KEY, JSON.stringify(next));
      else localStorage.removeItem(KEY);
    } catch {
      // Private browsing — they sign in again.
    }
    for (const listener of listeners) listener();
  }

  return [value, set] as const;
}
