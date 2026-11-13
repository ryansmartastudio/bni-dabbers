"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TEAMS, getTeam } from "@/lib/workshop/config";
import { normaliseText } from "@/lib/workshop/normalise";
import type { PortalContact } from "@/lib/workshop/portal";

/**
 * The invite map: one session's contacts as a radial tree.
 *
 * Chapter → power team → open seat → the person somebody is going to invite.
 * The list beside it is the working surface; this is the thing that makes the
 * shape of the night obvious at a glance — which categories the room filled,
 * which are thin, and how much of it nobody has picked up yet.
 *
 * Desktop only. It is deliberately not rendered on a phone: a hundred radial
 * labels on a 390px screen is a worse version of the list.
 */

const SIZE = 900;
const C = SIZE / 2;

const R_HUB = 46;
const R_TEAM_IN = 58;
const R_TEAM_OUT = 88;
const R_SEAT_IN = 96;
const R_SEAT_OUT = 124;

const TEAM_GAP = 6;
const SEAT_GAP = 1.4;

/**
 * No seat gets a slice too thin to label.
 *
 * Angle is otherwise shared out by head count, which is right for the names
 * but would leave a category with one contact as an unreadable sliver — and
 * the categories are half the point of the picture.
 */
const MIN_SEAT_SPAN = 11;

const UNSEATED = "__unseated__";
const UNSEATED_ACCENT = "#9A9CA1";

/** Long seat names never fit on their arc; these are how members say them. */
const SHORT_SEAT: Record<string, string> = {
  "Builder / General Contractor": "Builder",
  "Architect / Arch. Technician": "Architect",
  "Kitchen & Bathroom Installer": "Kitchen & Bath",
  "CCTV & Security": "CCTV",
  "Estate & Lettings Agent": "Estate Agent",
  "Conveyancing Solicitor": "Conveyancer",
  "Removals & Storage": "Removals",
  "Later-Life Care Provider": "Later-Life Care",
  "Interior Designer": "Interiors",
  "Energy & Utilities Broker": "Energy Broker",
  "Commercial Cleaning": "Cleaning",
  "Commercial Solicitor": "Commercial Law",
  "Cyber Security": "Cyber",
  "Commercial Photographer": "Photographer",
  "Promotional Products": "Promo Products",
  "Event Planner": "Events",
  "SEO / Lead Gen": "SEO",
};

const SHORT_TEAM: Record<string, string> = {
  "Property & Trades": "Property",
  "Home & Life Events": "Home & Life",
  "Business Services": "Business",
  "Marketing & Visual": "Marketing",
  "No seat yet": "No seat",
};

function shortSeat(label: string): string {
  return SHORT_SEAT[label] ?? label.split(" / ")[0];
}

const rad = (deg: number) => (deg * Math.PI) / 180;
const px = (deg: number, r: number) => C + r * Math.cos(rad(deg));
const py = (deg: number, r: number) => C + r * Math.sin(rad(deg));
const norm = (deg: number) => ((deg % 360) + 360) % 360;

function arcBand(start: number, end: number, rIn: number, rOut: number): string {
  const large = end - start > 180 ? 1 : 0;
  return [
    `M${px(start, rOut)},${py(start, rOut)}`,
    `A${rOut},${rOut} 0 ${large} 1 ${px(end, rOut)},${py(end, rOut)}`,
    `L${px(end, rIn)},${py(end, rIn)}`,
    `A${rIn},${rIn} 0 ${large} 0 ${px(start, rIn)},${py(start, rIn)}`,
    "Z",
  ].join("");
}

/**
 * An arc for a curved label, drawn backwards across the bottom half so the
 * text never ends up upside down.
 */
function textArc(start: number, end: number, r: number): string {
  const large = Math.abs(end - start) > 180 ? 1 : 0;
  const mid = norm((start + end) / 2);
  if (mid > 0 && mid < 180) {
    return `M${px(end, r)},${py(end, r)}A${r},${r} 0 ${large} 0 ${px(start, r)},${py(start, r)}`;
  }
  return `M${px(start, r)},${py(start, r)}A${r},${r} 0 ${large} 1 ${px(end, r)},${py(end, r)}`;
}

/** A radial bezier — the shape that makes a tree read as a tree. */
function spoke(a0: number, r0: number, a1: number, r1: number): string {
  const m = (r0 + r1) / 2;
  return [
    `M${px(a0, r0)},${py(a0, r0)}`,
    `C${px(a0, m)},${py(a0, m)}`,
    `${px(a1, m)},${py(a1, m)}`,
    `${px(a1, r1)},${py(a1, r1)}`,
  ].join(" ");
}

const arcLength = (spanDeg: number, r: number) => (Math.abs(spanDeg) * Math.PI * r) / 180;

const WIDE_GLYPHS = new Set(["M", "W", "@"]);
const NARROW_GLYPHS = new Set([
  "I", "J", "l", "i", "t", "f", "r", ".", ",", ":", ";", "'", "!", "|", "\u00B7", " ", "-",
]);

/**
 * How wide a string will be, near enough.
 *
 * A flat characters-per-arc estimate was wrong in both directions at once —
 * it ran "MARKETING & VISUAL" off the end of its band while rejecting labels
 * that would have fitted — because the strings here mix wide capitals with
 * spaces, a middot and a digit. Per-glyph widths, measured against the
 * rendered font, with a little headroom on top.
 */
function textWidth(text: string, fontSize: number, tracking: number): number {
  let em = 0;
  for (const ch of text) {
    if (WIDE_GLYPHS.has(ch)) em += 0.92;
    else if (NARROW_GLYPHS.has(ch)) em += 0.31;
    else if (ch >= "0" && ch <= "9") em += 0.6;
    else em += 0.69;
  }
  return (em + text.length * tracking) * fontSize * 1.06;
}

/**
 * The fullest label that fits on an arc: the preferred form, then each
 * fallback, then a truncation, then nothing.
 */
function fitLabel(
  options: string[],
  spanDeg: number,
  r: number,
  fontSize: number,
  tracking: number,
): string | null {
  const room = arcLength(spanDeg, r) * 0.96;
  for (const option of options) {
    if (textWidth(option, fontSize, tracking) <= room) return option;
  }

  let text = options[options.length - 1] ?? "";
  while (text.length > 3 && textWidth(`${text.trimEnd()}\u2026`, fontSize, tracking) > room) {
    text = text.slice(0, -1);
  }
  const clipped = `${text.trimEnd()}\u2026`;
  return textWidth(clipped, fontSize, tracking) <= room ? clipped : null;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

type Leaf = { contact: PortalContact; angle: number; order: number };

type SeatNode = {
  key: string;
  label: string;
  accent: string;
  start: number;
  end: number;
  mid: number;
  leaves: Leaf[];
};

type TeamNode = {
  key: string;
  name: string;
  accent: string;
  start: number;
  end: number;
  mid: number;
  count: number;
  seats: SeatNode[];
};

type MapScale = {
  leaf: number;
  label: number;
  font: number;
  dot: number;
  maxChars: number;
  ringIn: number;
  ringOut: number;
};

function scaleFor(n: number): MapScale {
  if (n <= 36) {
    return { leaf: 190, label: 199, font: 13, dot: 6.5, maxChars: 20, ringIn: 356, ringOut: 390 };
  }
  if (n <= 80) {
    return { leaf: 198, label: 206, font: 11, dot: 5.2, maxChars: 20, ringIn: 340, ringOut: 374 };
  }
  return { leaf: 212, label: 219, font: 9.2, dot: 4.2, maxChars: 22, ringIn: 344, ringOut: 378 };
}

function buildTree(contacts: PortalContact[]): TeamNode[] {
  const order: Array<{ key: string; name: string; accent: string }> = [
    ...TEAMS.map((t) => ({ key: t.id as string, name: t.name, accent: t.accent })),
    { key: UNSEATED, name: "No seat yet", accent: UNSEATED_ACCENT },
  ];

  const byTeam = new Map<string, Map<string, PortalContact[]>>();
  for (const contact of contacts) {
    const teamKey = contact.seatTeam ?? UNSEATED;
    const seatKey = contact.seat || "Other";
    const seats = byTeam.get(teamKey) ?? new Map<string, PortalContact[]>();
    const list = seats.get(seatKey) ?? [];
    list.push(contact);
    seats.set(seatKey, list);
    byTeam.set(teamKey, seats);
  }

  const active = order.filter((t) => (byTeam.get(t.key)?.size ?? 0) > 0);
  if (active.length === 0) return [];

  // Pass one: every seat's share of the circle, by head count but never below
  // the width a label needs. Pass two normalises them back to a full circle.
  type Draft = { team: (typeof active)[number]; seatKey: string; rows: PortalContact[]; span: number };
  const drafts: Draft[] = [];
  const available = 360 - active.length * TEAM_GAP;
  const perLeaf = available / Math.max(1, contacts.length);

  for (const team of active) {
    const seatMap = byTeam.get(team.key);
    if (!seatMap) continue;
    const seatKeys = [...seatMap.keys()].sort((a, b) => {
      const diff = (seatMap.get(b)?.length ?? 0) - (seatMap.get(a)?.length ?? 0);
      return diff !== 0 ? diff : a.localeCompare(b, "en-GB");
    });
    for (const seatKey of seatKeys) {
      const rows = (seatMap.get(seatKey) ?? [])
        .slice()
        .sort((a, b) => a.contactName.localeCompare(b.contactName, "en-GB"));
      drafts.push({
        team,
        seatKey,
        rows,
        span: Math.max(MIN_SEAT_SPAN, rows.length * perLeaf),
      });
    }
  }

  const factor = available / drafts.reduce((sum, d) => sum + d.span, 0);
  for (const draft of drafts) draft.span *= factor;

  let cursor = -90 + TEAM_GAP / 2;
  let leafOrder = 0;
  const tree: TeamNode[] = [];

  for (const team of active) {
    const mine = drafts.filter((d) => d.team.key === team.key);
    const teamStart = cursor;
    const seats: SeatNode[] = [];
    let seatCursor = cursor;

    for (const draft of mine) {
      const trim = Math.min(SEAT_GAP / 2, draft.span * 0.14);
      const inner = draft.span - 2 * trim;
      seats.push({
        key: `${team.key}:${draft.seatKey}`,
        label: draft.seatKey,
        accent: team.accent,
        start: seatCursor + trim,
        end: seatCursor + draft.span - trim,
        mid: seatCursor + draft.span / 2,
        leaves: draft.rows.map((contact, i) => ({
          contact,
          // Spread across the seat's own slice, so a quiet category gives its
          // one or two names room rather than stacking them on one spoke.
          angle:
            seatCursor + trim + (draft.rows.length === 1
              ? inner / 2
              : (inner * (i + 0.5)) / draft.rows.length),
          // Baked in at build time so the staggered entrance has a stable
          // order: a counter walked during render is a reassignment React
          // Compiler rightly refuses.
          order: leafOrder++,
        })),
      });
      seatCursor += draft.span;
    }

    tree.push({
      key: team.key,
      name: team.name,
      accent: team.accent,
      start: teamStart + TEAM_GAP / 4,
      end: seatCursor - TEAM_GAP / 4,
      mid: (teamStart + seatCursor) / 2,
      count: mine.reduce((sum, d) => sum + d.rows.length, 0),
      seats,
    });

    cursor = seatCursor + TEAM_GAP;
  }

  return tree;
}

type HoverTarget =
  | { kind: "leaf"; key: string; seatKey: string; contact: PortalContact; angle: number; radius: number }
  | { kind: "seat"; key: string; seat: SeatNode; team: TeamNode; angle: number; radius: number }
  | { kind: "team"; team: TeamNode; angle: number; radius: number }
  | null;

type View = { s: number; x: number; y: number };

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const IDENTITY: View = { s: 1, x: 0, y: 0 };

/** Keeps the content from being dragged out of the frame entirely. */
function clampView(view: View): View {
  const s = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.s));
  const limit = -(s - 1) * SIZE;
  return {
    s,
    x: Math.min(0, Math.max(limit, view.x)),
    y: Math.min(0, Math.max(limit, view.y)),
  };
}

export function ContactMap({
  contacts,
  me,
  activeSeat,
  onSeat,
  onOpen,
  reduced,
}: {
  contacts: PortalContact[];
  me: string;
  activeSeat: string | null;
  onSeat: (seatKey: string | null) => void;
  onOpen: (id: string) => void;
  reduced: boolean;
}) {
  const [hover, setHover] = useState<HoverTarget>(null);
  const [view, setView] = useState<View>(IDENTITY);
  const [dragging, setDragging] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragFrom = useRef<{ x: number; y: number; view: View } | null>(null);
  // A drag that ends over a name must not also open that name.
  const movedRef = useRef(false);

  const tree = useMemo(() => buildTree(contacts), [contacts]);
  const scale = scaleFor(contacts.length);
  const mineKey = normaliseText(me);

  const hubCount = useMemo(() => {
    if (!activeSeat) return contacts.length;
    return contacts.filter(
      (c) => `${c.seatTeam ?? UNSEATED}:${c.seat || "Other"}` === activeSeat,
    ).length;
  }, [contacts, activeSeat]);

  /** Pointer position in viewBox units, before the pan/zoom transform. */
  const toViewBox = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return { x: C, y: C };
    return {
      x: ((clientX - rect.left) / rect.width) * SIZE,
      y: ((clientY - rect.top) / rect.height) * SIZE,
    };
  }, []);

  const zoomAt = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      setView((current) => {
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current.s * factor));
        if (next === current.s) return current;
        const anchor =
          clientX === undefined || clientY === undefined
            ? { x: C, y: C }
            : toViewBox(clientX, clientY);
        const ratio = next / current.s;
        return clampView({
          s: next,
          x: anchor.x - (anchor.x - current.x) * ratio,
          y: anchor.y - (anchor.y - current.y) * ratio,
        });
      });
    },
    [toViewBox],
  );

  // Attached by hand because React's onWheel is passive, and a passive
  // listener cannot stop the page scrolling underneath the map.
  useEffect(() => {
    const node = svgRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomAt(Math.exp(-event.deltaY * 0.0022), event.clientX, event.clientY);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  if (contacts.length === 0) {
    return (
      <div className="mx-auto flex aspect-square max-w-[560px] items-center justify-center rounded-3xl border border-dashed border-border bg-white">
        <p className="max-w-[18rem] text-center text-sm text-muted">
          No names in this session yet. The map fills in as the room adds them.
        </p>
      </div>
    );
  }

  const hoverSeatKey =
    hover?.kind === "leaf" ? hover.seatKey : hover?.kind === "seat" ? hover.key : null;
  const hoverTeamKey =
    hover?.kind === "team"
      ? hover.team.key
      : hover?.kind === "seat"
        ? hover.team.key
        : null;

  const seatFaded = (seatKey: string, teamKey: string) => {
    if (activeSeat && seatKey !== activeSeat) return true;
    if (!hover) return false;
    if (hoverTeamKey && hover.kind === "team") return hoverTeamKey !== teamKey;
    return hoverSeatKey !== seatKey;
  };

  const leafFaded = (seatKey: string, teamKey: string, leafId: string) => {
    if (activeSeat && seatKey !== activeSeat) return true;
    if (!hover) return false;
    if (hover.kind === "team") return hover.team.key !== teamKey;
    if (hover.kind === "seat") return hover.key !== seatKey;
    return hover.key !== leafId;
  };

  const startDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    movedRef.current = false;
    dragFrom.current = { x: event.clientX, y: event.clientY, view };
  };

  /**
   * The pointer is captured only once the press turns into a real drag.
   *
   * Capturing on pointerdown re-targets everything that follows at the <svg>,
   * so the click never reached the name or the category arc underneath and
   * nothing on the map could be clicked at all.
   */
  const moveDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    const from = dragFrom.current;
    if (!from) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;

    if (
      !movedRef.current &&
      Math.abs(event.clientX - from.x) + Math.abs(event.clientY - from.y) > 4
    ) {
      movedRef.current = true;
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!movedRef.current) return;

    const dx = ((event.clientX - from.x) / rect.width) * SIZE;
    const dy = ((event.clientY - from.y) / rect.height) * SIZE;
    setView(clampView({ s: from.view.s, x: from.view.x + dx, y: from.view.y + dy }));
  };

  const endDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    dragFrom.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const zoomed = view.s > 1.001;

  return (
    <div className="workshop-map relative mx-auto aspect-square w-[min(100%,88vh)] select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-full w-full touch-none overflow-hidden"
        style={{ cursor: dragging ? "grabbing" : zoomed ? "grab" : "default" }}
        role="img"
        aria-label="Invite map"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => setView(IDENTITY)}
      >
        <title>Every contact, grouped by power team and open seat</title>

        <g transform={`translate(${view.x},${view.y}) scale(${view.s})`}>
          {/* Power teams */}
          {tree.map((team, i) => {
            const midR = (R_TEAM_IN + R_TEAM_OUT) / 2;
            const label = fitLabel(
              [team.name.toUpperCase(), (SHORT_TEAM[team.name] ?? team.name).toUpperCase()],
              team.end - team.start,
              midR,
              10.5,
              0.04,
            );
            const faded = hover
              ? (hover.kind === "team" ? hover.team.key : hoverTeamKey) !== team.key
              : false;
            return (
              <motion.g
                key={team.key}
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: faded ? 0.3 : 1 }}
                transition={{ delay: reduced ? 0 : 0.05 + i * 0.06, duration: 0.45 }}
                style={{ cursor: "pointer" }}
                onMouseEnter={() =>
                  setHover({ kind: "team", team, angle: team.mid, radius: R_TEAM_OUT })
                }
                onMouseLeave={() => setHover(null)}
              >
                <path d={arcBand(team.start, team.end, R_TEAM_IN, R_TEAM_OUT)} fill={team.accent} />
                {label ? (
                  <>
                    <path
                      id={`team-arc-${team.key}`}
                      d={textArc(team.start, team.end, midR)}
                      fill="none"
                    />
                    <text
                      fontSize={10.5}
                      fontWeight={800}
                      fill="#FFFFFF"
                      letterSpacing="0.04em"
                      dominantBaseline="middle"
                      pointerEvents="none"
                    >
                      <textPath
                        href={`#team-arc-${team.key}`}
                        startOffset="50%"
                        textAnchor="middle"
                      >
                        {label}
                      </textPath>
                    </text>
                  </>
                ) : null}
              </motion.g>
            );
          })}

          {/* Categories: a colour chip on the inside, the name on the outside */}
          {tree.flatMap((team) =>
            team.seats.map((seat, i) => {
              const isActive = activeSeat === seat.key;
              const faded = seatFaded(seat.key, team.key);
              const hovered = hoverSeatKey === seat.key;
              const lift = hovered ? 5 : 0;
              const ringMid = (scale.ringIn + scale.ringOut) / 2;
              const label = fitLabel(
                [
                  `${shortSeat(seat.label).toUpperCase()} · ${seat.leaves.length}`,
                  shortSeat(seat.label).toUpperCase(),
                ],
                seat.end - seat.start,
                ringMid,
                11,
                0.05,
              );

              return (
                <motion.g
                  key={seat.key}
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: faded ? 0.2 : 1 }}
                  transition={{ delay: reduced ? 0 : 0.22 + i * 0.03, duration: 0.4 }}
                  style={{
                    cursor: "pointer",
                    transform: `translate(${lift * Math.cos(rad(seat.mid))}px, ${lift * Math.sin(rad(seat.mid))}px)`,
                    transition: "transform 180ms cubic-bezier(.2,.8,.2,1)",
                  }}
                  onMouseEnter={() =>
                    setHover({
                      kind: "seat",
                      key: seat.key,
                      seat,
                      team,
                      angle: seat.mid,
                      radius: scale.ringOut,
                    })
                  }
                  onMouseLeave={() => setHover(null)}
                  onClick={() => {
                    if (movedRef.current) return;
                    onSeat(isActive ? null : seat.key);
                  }}
                >
                  <path
                    d={arcBand(seat.start, seat.end, R_SEAT_IN, R_SEAT_OUT)}
                    fill={seat.accent}
                    fillOpacity={isActive ? 0.95 : 0.2}
                    stroke={seat.accent}
                    strokeWidth={isActive ? 2 : 1}
                  />
                  <text
                    x={px(seat.mid, (R_SEAT_IN + R_SEAT_OUT) / 2)}
                    y={py(seat.mid, (R_SEAT_IN + R_SEAT_OUT) / 2)}
                    fontSize={11}
                    fontWeight={800}
                    fill={isActive ? "#FFFFFF" : seat.accent}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    pointerEvents="none"
                  >
                    {seat.leaves.length}
                  </text>

                  <path
                    d={arcBand(seat.start, seat.end, scale.ringIn, scale.ringOut)}
                    fill={seat.accent}
                    fillOpacity={isActive ? 0.95 : hovered ? 0.3 : 0.12}
                    stroke={seat.accent}
                    strokeWidth={isActive ? 2 : 1}
                    style={{ transition: "fill-opacity 180ms ease" }}
                  />
                  {label ? (
                    <>
                      <path
                        id={`seat-arc-${seat.key}`}
                        d={textArc(seat.start, seat.end, ringMid)}
                        fill="none"
                      />
                      <text
                        fontSize={11}
                        fontWeight={800}
                        fill={isActive ? "#FFFFFF" : seat.accent}
                        letterSpacing="0.05em"
                        dominantBaseline="middle"
                        pointerEvents="none"
                      >
                        <textPath
                          href={`#seat-arc-${seat.key}`}
                          startOffset="50%"
                          textAnchor="middle"
                        >
                          {label}
                        </textPath>
                      </text>
                    </>
                  ) : null}
                </motion.g>
              );
            }),
          )}

          {/* Spokes out to every name */}
          {tree.flatMap((team) =>
            team.seats.flatMap((seat) =>
              seat.leaves.map((leaf) => {
                const faded = leafFaded(seat.key, team.key, leaf.contact.id);
                const lit = hover?.kind === "leaf" && hover.key === leaf.contact.id;
                const delay = 0.3 + leaf.order * (contacts.length > 70 ? 0.003 : 0.01);
                return (
                  <path
                    key={`spoke-${leaf.contact.id}`}
                    d={spoke(seat.mid, R_SEAT_OUT, leaf.angle, scale.leaf)}
                    fill="none"
                    stroke={seat.accent}
                    strokeWidth={lit ? 2 : 1}
                    strokeOpacity={faded ? 0.07 : lit ? 0.95 : 0.32}
                    pathLength={1}
                    strokeDasharray={1}
                    pointerEvents="none"
                    style={{
                      transition: "stroke-opacity 180ms ease, stroke-width 180ms ease",
                      ...(reduced
                        ? { strokeDashoffset: 0 }
                        : {
                            animation: `workshop-map-draw 700ms cubic-bezier(.3,.9,.3,1) ${delay}s both`,
                          }),
                    }}
                  />
                );
              }),
            ),
          )}

          {/* The names */}
          {tree.flatMap((team) =>
            team.seats.flatMap((seat) =>
              seat.leaves.map((leaf) => {
                const contact = leaf.contact;
                const faded = leafFaded(seat.key, team.key, contact.id);
                const mine = normaliseText(contact.claimedBy ?? "") === mineKey;
                const claimed = Boolean(contact.claimedBy);
                const invited = Boolean(contact.invitedAt);
                const deg = norm(leaf.angle);
                const flip = deg > 90 && deg < 270;
                const lit = hover?.kind === "leaf" && hover.key === contact.id;
                const delay = 0.45 + leaf.order * (contacts.length > 70 ? 0.004 : 0.012);
                const x = px(leaf.angle, scale.leaf);
                const y = py(leaf.angle, scale.leaf);

                return (
                  <g
                    key={contact.id}
                    style={{
                      cursor: "pointer",
                      opacity: faded ? 0.15 : 1,
                      transition: "opacity 180ms ease",
                    }}
                    onMouseEnter={() =>
                      setHover({
                        kind: "leaf",
                        key: contact.id,
                        seatKey: seat.key,
                        contact,
                        angle: leaf.angle,
                        radius: scale.leaf,
                      })
                    }
                    onMouseLeave={() => setHover(null)}
                    onClick={() => {
                      if (movedRef.current) return;
                      onOpen(contact.id);
                    }}
                  >
                    <g
                      data-leaf
                      style={
                        reduced
                          ? undefined
                          : {
                              animation: `workshop-map-pop 420ms cubic-bezier(.2,1.3,.4,1) ${delay}s both`,
                            }
                      }
                    >
                      {lit ? (
                        <circle
                          cx={x}
                          cy={y}
                          r={scale.dot + 7}
                          fill={mine ? "#CF2030" : seat.accent}
                          fillOpacity={0.18}
                        />
                      ) : null}
                      {invited ? (
                        <circle
                          cx={x}
                          cy={y}
                          r={scale.dot + 3.4}
                          fill="none"
                          stroke="#1F7A3E"
                          strokeWidth={1.8}
                        />
                      ) : null}
                      <circle
                        cx={x}
                        cy={y}
                        r={lit ? scale.dot + 1.6 : scale.dot}
                        fill={mine ? "#CF2030" : claimed ? seat.accent : "#FFFFFF"}
                        fillOpacity={claimed && !mine ? 0.55 : 1}
                        stroke={mine ? "#8E1520" : seat.accent}
                        strokeWidth={claimed ? 1 : 2}
                        style={{ transition: "r 160ms ease, fill 260ms ease" }}
                      />
                    </g>
                    <text
                      transform={`translate(${C},${C}) rotate(${leaf.angle}) translate(${scale.label + scale.dot},0)${flip ? " rotate(180)" : ""}`}
                      textAnchor={flip ? "end" : "start"}
                      dominantBaseline="middle"
                      fontSize={scale.font}
                      fontWeight={mine || lit ? 800 : claimed ? 500 : 650}
                      fill={mine ? "#CF2030" : lit ? "#1A1A1A" : claimed ? "#8A8C90" : "#2B2C30"}
                      style={{
                        transition: "fill 200ms ease",
                        ...(reduced
                          ? {}
                          : { animation: `workshop-map-fade 420ms ease ${delay + 0.06}s both` }),
                      }}
                    >
                      {truncate(contact.contactName, scale.maxChars)}
                    </text>
                  </g>
                );
              }),
            ),
          )}

          {/* Hub */}
          <motion.g
            initial={reduced ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            style={{ transformOrigin: `${C}px ${C}px` }}
          >
            <circle cx={C} cy={C} r={R_HUB} fill="#FFFFFF" stroke="#CF2030" strokeWidth={2.5} />
            <text x={C} y={C - 5} textAnchor="middle" fontSize={26} fontWeight={900} fill="#CF2030">
              {hubCount}
            </text>
            <text
              x={C}
              y={C + 15}
              textAnchor="middle"
              fontSize={8.5}
              fontWeight={700}
              letterSpacing="0.1em"
              fill="#8A8C90"
            >
              {activeSeat ? "IN HERE" : "CONTACTS"}
            </text>
          </motion.g>
        </g>
      </svg>

      <div className="absolute right-0 top-0 flex items-center gap-1 rounded-xl border border-border bg-white/90 p-1 backdrop-blur">
        <ZoomButton label="Zoom out" onClick={() => zoomAt(1 / 1.4)} disabled={view.s <= MIN_ZOOM}>
          &minus;
        </ZoomButton>
        <span className="w-9 text-center text-[11px] font-bold tabular-nums text-muted">
          {view.s.toFixed(1)}&times;
        </span>
        <ZoomButton label="Zoom in" onClick={() => zoomAt(1.4)} disabled={view.s >= MAX_ZOOM}>
          +
        </ZoomButton>
        <ZoomButton label="Reset the view" onClick={() => setView(IDENTITY)} disabled={!zoomed}>
          <span className="text-[13px]">⤾</span>
        </ZoomButton>
      </div>

      <AnimatePresence>
        {hover ? (
          <MapTooltip
            key={hover.kind === "team" ? `team-${hover.team.key}` : hover.key}
            target={hover}
            view={view}
            mineKey={mineKey}
            reduced={reduced}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ZoomButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-foreground transition hover:bg-surface-muted disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/**
 * One tooltip for everything on the map.
 *
 * It is the answer to any label the geometry had to crop: a name trimmed to
 * fit its spoke, a category abbreviated to fit its arc. Whatever is cropped on
 * the map is spelled out in full here.
 */
function MapTooltip({
  target,
  view,
  mineKey,
  reduced,
}: {
  target: NonNullable<HoverTarget>;
  view: View;
  mineKey: string;
  reduced: boolean;
}) {
  // The anchor lives in the transformed group, so the pan and zoom have to be
  // applied by hand to put the card next to what the eye is looking at.
  const vx = px(target.angle, target.radius) * view.s + view.x;
  const vy = py(target.angle, target.radius) * view.s + view.y;
  const left = (vx / SIZE) * 100;
  const top = (vy / SIZE) * 100;
  const flip = left > 55;

  const body =
    target.kind === "leaf" ? (
      <LeafTooltip contact={target.contact} mineKey={mineKey} />
    ) : target.kind === "seat" ? (
      <SeatTooltip seat={target.seat} team={target.team} mineKey={mineKey} />
    ) : (
      <TeamTooltip team={target.team} />
    );

  // The offset lives on a plain wrapper, not on the animated element: Motion
  // owns `transform` on whatever it animates, and writing the translate into
  // the same property had it dropped the moment the spring started.
  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        left: `${Math.min(100, Math.max(0, left))}%`,
        top: `${Math.min(100, Math.max(0, top))}%`,
        transform: `translate(${flip ? "calc(-100% - 12px)" : "12px"}, -50%)`,
      }}
    >
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
        className="w-56 rounded-xl border border-border bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.16)]"
        style={{ transformOrigin: flip ? "right center" : "left center" }}
      >
        {body}
      </motion.div>
    </div>
  );
}

function LeafTooltip({ contact, mineKey }: { contact: PortalContact; mineKey: string }) {
  const mine = normaliseText(contact.claimedBy ?? "") === mineKey;
  const team = contact.seatTeam ? getTeam(contact.seatTeam) : null;
  const accent = team?.accent ?? UNSEATED_ACCENT;

  return (
    <>
      <p className="text-sm font-bold text-foreground">{contact.contactName}</p>
      {contact.company ? (
        <p className="mt-0.5 text-xs text-muted">{contact.company}</p>
      ) : null}
      <p className="mt-2 flex items-start gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em]">
        <span
          className="mt-[3px] inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ background: accent }}
        />
        <span style={{ color: accent }}>{contact.seat}</span>
      </p>
      <p className="mt-2 text-xs">
        {contact.claimedBy ? (
          <span className={mine ? "font-bold text-bni" : "text-muted"}>
            {mine ? "You're inviting them" : `${contact.claimedBy} is inviting them`}
          </span>
        ) : (
          <span className="font-semibold text-foreground">Nobody has taken this one on</span>
        )}
      </p>
      {contact.submitterName ? (
        <p className="mt-1 text-[11px] text-ink-muted">Added by {contact.submitterName}</p>
      ) : null}
    </>
  );
}

function SeatTooltip({
  seat,
  team,
  mineKey,
}: {
  seat: SeatNode;
  team: TeamNode;
  mineKey: string;
}) {
  const total = seat.leaves.length;
  const claimed = seat.leaves.filter((l) => l.contact.claimedBy).length;
  const mine = seat.leaves.filter(
    (l) => normaliseText(l.contact.claimedBy ?? "") === mineKey,
  ).length;

  return (
    <>
      <p className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: team.accent }}>
        {team.name}
      </p>
      <p className="mt-0.5 text-sm font-bold text-foreground">{seat.label}</p>
      <p className="mt-2 text-xs text-muted">
        <strong className="font-bold text-foreground">{total}</strong>{" "}
        {total === 1 ? "name" : "names"} · {total - claimed} up for grabs
        {mine > 0 ? ` · ${mine} yours` : ""}
      </p>
      <p className="mt-1.5 text-[11px] text-ink-muted">Click to filter the list to this category.</p>
    </>
  );
}

function TeamTooltip({ team }: { team: TeamNode }) {
  return (
    <>
      <p className="text-sm font-bold" style={{ color: team.accent }}>
        {team.name}
      </p>
      <p className="mt-1 text-xs text-muted">
        <strong className="font-bold text-foreground">{team.count}</strong>{" "}
        {team.count === 1 ? "name" : "names"} across {team.seats.length}{" "}
        {team.seats.length === 1 ? "category" : "categories"}
      </p>
    </>
  );
}
