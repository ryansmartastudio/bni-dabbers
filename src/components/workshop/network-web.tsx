"use client";

import { useEffect, useRef } from "react";

type NetworkWebProps = {
  membersToday: number;
  newMembers: number;
  reduced: boolean;
  /** Called with the current member count as the web grows. */
  onProgress: (members: number) => void;
};

const GREY = "#64666A";
const RED = "#CF2030";
const GOLD = "rgba(201,162,39,0.32)";

/**
 * The chapter as a web: every member joined to every other.
 *
 * The point it has to land is that the lines grow far faster than the dots, so
 * new members are drawn in their own colour and every line they bring appears
 * with them.
 */
export function NetworkWeb({
  membersToday,
  newMembers,
  reduced,
  onProgress,
}: NetworkWebProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(onProgress);

  // Kept in a ref so a new callback identity doesn't restart the animation,
  // and updated in an effect rather than during render.
  useEffect(() => {
    progressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let stopped = false;
    const start = performance.now() + (reduced ? 0 : 900);
    const duration = reduced ? 0 : Math.max(2600, newMembers * 420);

    function measure() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = Math.max(1, Math.round(rect.width * dpr));
      canvas!.height = Math.max(1, Math.round(rect.height * dpr));
      return { rect, dpr };
    }

    let { rect, dpr } = measure();

    function draw(now: number) {
      if (stopped) return;

      const live = canvas!.getBoundingClientRect();
      if (Math.abs(live.width - rect.width) > 1 || Math.abs(live.height - rect.height) > 1) {
        ({ rect, dpr } = measure());
      }

      const w = rect.width;
      const h = rect.height;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, w, h);

      const raw = duration === 0 ? 1 : (now - start) / duration;
      const t = Math.min(1, Math.max(0, raw));
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const shown = membersToday + newMembers * eased;
      const count = Math.ceil(shown - 1e-9);
      const cx = w / 2;
      const cy = h / 2;
      const radius = (Math.min(w, h) / 2 - 14) * (0.84 + 0.16 * eased);

      const points: Array<{ x: number; y: number; isNew: boolean; alpha: number }> = [];
      for (let i = 0; i < count; i += 1) {
        const angle = -Math.PI / 2 + (i / Math.max(shown, 1)) * Math.PI * 2;
        const isNew = i >= membersToday;
        points.push({
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
          isNew,
          alpha: isNew ? Math.min(1, shown - i) : 1,
        });
      }

      ctx!.strokeStyle = GOLD;
      ctx!.lineWidth = 1;
      for (let ring = 1; ring <= 4; ring += 1) {
        ctx!.beginPath();
        ctx!.arc(cx, cy, (radius * ring) / 4, 0, Math.PI * 2);
        ctx!.stroke();
      }

      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          const a = points[i]!;
          const b = points[j]!;
          const fresh = a.isNew || b.isNew;
          ctx!.strokeStyle = fresh
            ? `rgba(207,32,48,${0.3 * Math.min(a.alpha, b.alpha)})`
            : "rgba(100,102,106,0.13)";
          ctx!.lineWidth = fresh ? 1.2 : 0.8;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
      }

      for (const point of points) {
        ctx!.globalAlpha = point.alpha;
        ctx!.fillStyle = point.isNew ? RED : GREY;
        ctx!.beginPath();
        ctx!.arc(point.x, point.y, point.isNew ? 6.5 : 4.5, 0, Math.PI * 2);
        ctx!.fill();
        if (point.isNew) {
          ctx!.strokeStyle = "#ffffff";
          ctx!.lineWidth = 2;
          ctx!.stroke();
        }
      }
      ctx!.globalAlpha = 1;

      if (now >= start) progressRef.current(shown);
      if (t < 1) frame = requestAnimationFrame(draw);
    }

    frame = requestAnimationFrame(draw);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
    };
  }, [membersToday, newMembers, reduced]);

  return (
    <canvas
      ref={canvasRef}
      className="workshop-web-canvas"
      aria-label={`Network of ${membersToday} members, each connected to every other, growing by ${newMembers}`}
    />
  );
}
