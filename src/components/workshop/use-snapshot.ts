"use client";

import { useEffect, useRef, useState } from "react";
import type { WorkshopSnapshot } from "@/lib/workshop/snapshot";

/**
 * Resolves a workshop URL for whichever host the page was opened on.
 *
 * On the subdomain the proxy strips the `/workshop` segment, so the page lives
 * at `/` and the endpoint at `/api/state`. On the main-domain fallback the page
 * is at `/workshop` and the endpoint at `/workshop/api/state`. A bare absolute
 * path only works on one of the two.
 */
export function workshopPath(path: string): string {
  if (typeof window === "undefined") return path;
  const { pathname } = window.location;
  const onWorkshopSegment = pathname === "/workshop" || pathname.startsWith("/workshop/");
  return onWorkshopSegment ? `/workshop${path}` : path;
}

/**
 * Polls the session state and keeps a local countdown ticking between polls.
 *
 * The timer is driven off the server's `secondsLeft` plus elapsed wall time
 * since that response, so every device agrees even if its own clock is wrong,
 * and the number still moves every second rather than jumping on each poll.
 */
export function useSnapshot(initial: WorkshopSnapshot, intervalMs: number) {
  const [snapshot, setSnapshot] = useState(initial);
  const [secondsLeft, setSecondsLeft] = useState(initial.secondsLeft);
  // Set on mount rather than during render: Date.now() is impure, and a ref
  // seeded during render is re-evaluated on every pass.
  const receivedAt = useRef(0);
  const baseSeconds = useRef(initial.secondsLeft);

  useEffect(() => {
    receivedAt.current = Date.now();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(workshopPath("/api/state"), { cache: "no-store" });
        if (res.ok && !cancelled) {
          const next = (await res.json()) as WorkshopSnapshot;
          setSnapshot(next);
          baseSeconds.current = next.secondsLeft;
          receivedAt.current = Date.now();
          if (next.secondsLeft !== null) setSecondsLeft(next.secondsLeft);
          else setSecondsLeft(null);
        }
      } catch {
        // A dropped poll on venue wifi is expected; the next tick recovers.
      }
      if (!cancelled) timer = setTimeout(poll, intervalMs);
    }

    timer = setTimeout(poll, intervalMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [intervalMs]);

  // Smooth the countdown between polls.
  useEffect(() => {
    if (baseSeconds.current === null) return;
    const id = setInterval(() => {
      if (baseSeconds.current === null || receivedAt.current === 0) return;
      const elapsed = Math.floor((Date.now() - receivedAt.current) / 1000);
      setSecondsLeft(Math.max(0, baseSeconds.current - elapsed));
    }, 250);
    return () => clearInterval(id);
  }, [snapshot.version, snapshot.state]);

  return { snapshot, secondsLeft };
}

export function formatClock(seconds: number | null): string {
  if (seconds === null) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
