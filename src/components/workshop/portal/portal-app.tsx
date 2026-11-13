"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  claimForMe,
  openPortal,
  refreshPortal,
  releaseMine,
} from "@/actions/workshop-portal";
import { ContactMap } from "@/components/workshop/portal/contact-map";
import { ContactSheet } from "@/components/workshop/portal/contact-sheet";
import { usePortalSession } from "@/components/workshop/portal/portal-store";
import { TEAMS, getTeam } from "@/lib/workshop/config";
import { normaliseText } from "@/lib/workshop/normalise";
import type {
  PortalContact,
  PortalSessionSummary,
  PortalStats,
} from "@/lib/workshop/portal";
import type { WorkshopConstants } from "@/lib/workshop/config";

const REFRESH_MS = 6000;

type Filter = "all" | "unclaimed" | "mine" | "invited";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "unclaimed", label: "Up for grabs" },
  { id: "mine", label: "Mine" },
  { id: "invited", label: "Invited" },
  { id: "all", label: "Everyone" },
];

const UNSEATED = "__unseated__";

function seatKeyOf(contact: PortalContact): string {
  return `${contact.seatTeam ?? UNSEATED}:${contact.seat || "Other"}`;
}

function formatSessionLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function PortalApp({
  constants,
  meetingLabel,
  requestedSessionId,
}: {
  constants: WorkshopConstants;
  meetingLabel: string;
  requestedSessionId: string | null;
}) {
  const reduced = useReducedMotion() ?? false;
  const [session, setSession] = usePortalSession();
  const [contacts, setContacts] = useState<PortalContact[]>([]);
  const [names, setNames] = useState<string[]>([]);
  const [stats, setStats] = useState<PortalStats | null>(null);
  const [sessions, setSessions] = useState<PortalSessionSummary[]>([]);
  // What the server resolved; `wanted` is what this page is asking for, which
  // starts as whatever the link carried.
  const [wanted, setWanted] = useState<string | null>(requestedSessionId);
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("unclaimed");
  const [activeSeat, setActiveSeat] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const password = session?.password ?? null;
  const me = session?.memberName ?? null;

  const refresh = useCallback(async () => {
    if (!password) return;
    const result = await refreshPortal(password, me, wanted);
    if (result.ok) {
      setContacts(result.data.contacts);
      setStats(result.data.stats);
      setNames(result.data.names);
      setSessions(result.data.sessions);
      setResolvedId(result.data.sessionId);
    }
  }, [password, me, wanted]);

  // Claims change under members' feet, so the list keeps itself current.
  // Self-scheduling rather than setInterval, and deferred out of the effect
  // body, so a slow round trip can't stack requests on a phone.
  useEffect(() => {
    if (!password) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      await refresh();
      if (!cancelled) timer = setTimeout(tick, REFRESH_MS);
    };

    timer = setTimeout(tick, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [password, refresh]);

  function signIn(given: string) {
    setError(null);
    startTransition(async () => {
      const result = await openPortal(given, wanted);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setContacts(result.data.contacts);
      setNames(result.data.names);
      setSessions(result.data.sessions);
      setResolvedId(result.data.sessionId);
      setSession({ password: given, memberName: null });
    });
  }

  function act(
    run: () => Promise<{ ok: boolean; error?: string; data?: PortalContact }>,
  ) {
    setError(null);
    startTransition(async () => {
      const result = await run();
      if (!result.ok) {
        setError(result.error ?? "That didn't work.");
        await refresh();
        return;
      }
      if (result.data) {
        const updated = result.data;
        setContacts((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
      }
      await refresh();
    });
  }

  /** Switching run keeps the password; only the contacts change. */
  function switchSession(id: string) {
    setWanted(id);
    setActiveSeat(null);
    setOpenId(null);
    setContacts([]);
    setStats(null);
    try {
      window.history.replaceState(null, "", `?s=${id}`);
    } catch {
      // Not worth failing the switch over.
    }
  }

  const visible = useMemo(() => {
    const q = normaliseText(query);
    return contacts.filter((c) => {
      if (activeSeat && seatKeyOf(c) !== activeSeat) return false;
      if (filter === "unclaimed" && c.claimedBy) return false;
      if (filter === "invited" && !c.invitedAt) return false;
      if (filter === "mine" && (!me || normaliseText(c.claimedBy ?? "") !== normaliseText(me)))
        return false;
      if (!q) return true;
      return normaliseText(
        `${c.contactName} ${c.company} ${c.seat} ${c.claimedBy ?? ""} ${c.submitterName ?? ""}`,
      ).includes(q);
    });
  }, [contacts, filter, query, me, activeSeat]);

  const teamCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const contact of contacts) {
      const key = contact.seatTeam ?? UNSEATED;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [contacts]);

  if (!password) {
    return <PasswordGate onSubmit={signIn} pending={isPending} error={error} />;
  }

  if (!me) {
    return (
      <NamePicker
        names={names}
        onPick={(name) => setSession({ password, memberName: name })}
        onSignOut={() => setSession(null)}
      />
    );
  }

  const open = contacts.find((c) => c.id === openId) ?? null;
  const current = sessions.find((s) => s.id === resolvedId) ?? null;
  const seatLabel = activeSeat
    ? (contacts.find((c) => seatKeyOf(c) === activeSeat)?.seat ?? null)
    : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 sm:px-6 lg:max-w-[1480px] lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="marketing-eyebrow">BNI Dabbers · Visitor list</p>
          <h1 className="mt-1 text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
            Who are we inviting?
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sessions.length > 1 ? (
            <label className="flex items-center gap-2">
              <span className="sr-only">Which workshop</span>
              <select
                value={resolvedId ?? ""}
                onChange={(e) => switchSession(e.target.value)}
                className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatSessionLabel(s.createdAt)} · {s.contacts} names
                    {s.isLive ? " (current)" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button
            type="button"
            onClick={() => setSession({ password, memberName: null })}
            className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground"
          >
            {me} · switch
          </button>
        </div>
      </div>

      {current && !current.isLive ? (
        <p className="mt-3 rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-sm text-muted">
          You&rsquo;re looking at the workshop from{" "}
          <strong className="font-bold text-foreground">
            {formatSessionLabel(current.createdAt)}
          </strong>
          . Everything still works — claims, edits and the toolkit.
        </p>
      ) : null}

      <div className="mt-5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(400px,440px)] lg:items-start lg:gap-8">
        {/* The map is desktop-only: a hundred radial labels on a phone is just
            a worse list. */}
        <div className="hidden lg:block">
          <div className="rounded-3xl border border-border bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">The invite map</p>
                <p className="text-xs text-muted">
                  Hover for the full name, click to open. Scroll to zoom, drag to move,
                  double-click to reset.
                </p>
              </div>
              {activeSeat ? (
                <button
                  type="button"
                  onClick={() => setActiveSeat(null)}
                  className="rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-white"
                >
                  {seatLabel} ✕
                </button>
              ) : null}
            </div>

            <div className="mt-2">
              <ContactMap
                contacts={contacts}
                me={me}
                activeSeat={activeSeat}
                onSeat={setActiveSeat}
                onOpen={setOpenId}
                reduced={reduced}
              />
            </div>

            <div className="mt-2 space-y-2 border-t border-border pt-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {TEAMS.map((team) => (
                  <span key={team.id} className="flex items-center gap-1.5 text-xs">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: team.accent }}
                    />
                    <span className="font-semibold text-foreground">{team.name}</span>
                    <span className="text-ink-muted">{teamCounts.get(team.id) ?? 0}</span>
                  </span>
                ))}
              </div>
              <span className="flex flex-wrap items-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[#9A9CA1] bg-white" />
                  Up for grabs
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-bni" />
                  Yours
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[#1F7A3E]" />
                  Invited
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="lg:min-w-0">
          {stats ? (
            <div className="grid grid-cols-4 gap-2">
              <Stat label="Contacts" value={stats.total} />
              <Stat label="Claimed" value={stats.claimed} />
              <Stat label="Yours" value={stats.mine} accent />
              <Stat label="Invited" value={stats.invited} />
            </div>
          ) : null}

          <label className="mt-4 block">
            <span className="sr-only">Search the list</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, company, seat or who claimed it…"
              className="w-full rounded-xl border-[1.5px] border-[#BDBDC1] bg-white px-4 py-3 text-base outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/25"
            />
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                  filter === f.id
                    ? "bg-bni text-white"
                    : "border border-border bg-white text-muted hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {activeSeat && seatLabel ? (
            <button
              type="button"
              onClick={() => setActiveSeat(null)}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3.5 py-2 text-sm font-semibold text-foreground"
            >
              Category: {seatLabel}
              <span className="text-muted">✕</span>
            </button>
          ) : null}

          {error ? (
            <p className="mt-3 rounded-xl bg-[#FDECEE] px-4 py-3 text-sm font-semibold text-[#A51A26]">
              {error}
            </p>
          ) : null}

          <p className="mt-4 text-sm text-muted">
            {visible.length} {visible.length === 1 ? "contact" : "contacts"}
            {filter === "unclaimed" ? " nobody has taken on yet" : ""}
          </p>

          <div className="mt-3 space-y-2.5">
            {visible.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-white px-5 py-10 text-center text-sm text-muted">
                Nothing here. Try another filter.
              </p>
            ) : (
              visible.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  me={me}
                  reduced={reduced}
                  pending={isPending}
                  onOpen={() => setOpenId(contact.id)}
                  onClaim={() => act(() => claimForMe(password, contact.id, me, wanted))}
                  onRelease={() => act(() => releaseMine(password, contact.id, me, wanted))}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <ContactSheet
            key={open.id}
            contact={open}
            me={me}
            password={password}
            sessionId={wanted}
            constants={constants}
            meetingLabel={meetingLabel}
            reduced={reduced}
            onClose={() => setOpenId(null)}
            onChanged={(updated) => {
              setContacts((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
              void refresh();
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-2.5 text-center ${accent ? "bg-[#FDF1F2]" : "bg-surface-muted"}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
        {label}
      </p>
      <p className={`mt-0.5 text-xl font-bold ${accent ? "text-bni" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function ContactRow({
  contact,
  me,
  reduced,
  pending,
  onOpen,
  onClaim,
  onRelease,
}: {
  contact: PortalContact;
  me: string;
  reduced: boolean;
  pending: boolean;
  onOpen: () => void;
  onClaim: () => void;
  onRelease: () => void;
}) {
  const mine = normaliseText(contact.claimedBy ?? "") === normaliseText(me);
  const team = contact.seatTeam ? getTeam(contact.seatTeam) : null;

  return (
    <motion.div
      layout={!reduced}
      className={`rounded-2xl border-2 bg-white p-4 transition-shadow hover:shadow-[0_6px_24px_rgba(0,0,0,0.07)] ${
        mine ? "border-bni" : contact.claimedBy ? "border-border opacity-80" : "border-border"
      }`}
    >
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-foreground">
              {contact.contactName}
            </p>
            <p className="truncate text-sm text-muted">{contact.company}</p>
          </div>
          {team ? (
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
              style={{ background: team.accent }}
            >
              {contact.seat}
            </span>
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {contact.submitterName ? <span>Added by {contact.submitterName}</span> : null}
          {contact.invitedAt ? (
            <span className="font-bold text-[#1F7A3E]">Invited</span>
          ) : null}
        </div>
      </button>

      <div className="mt-3 flex items-center justify-between gap-3">
        {contact.claimedBy ? (
          <span className={`text-sm font-semibold ${mine ? "text-bni" : "text-muted"}`}>
            {mine ? "You're inviting them" : `${contact.claimedBy} is inviting them`}
          </span>
        ) : (
          <span className="text-sm text-muted">Nobody yet</span>
        )}

        {mine ? (
          <span className="flex gap-2">
            <button
              type="button"
              onClick={onOpen}
              className="rounded-lg bg-bni px-3.5 py-2 text-sm font-bold text-white"
            >
              Open toolkit
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onRelease}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-muted disabled:opacity-60"
            >
              Release
            </button>
          </span>
        ) : contact.claimedBy ? null : (
          <button
            type="button"
            disabled={pending}
            onClick={onClaim}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            I&rsquo;ll invite them
          </button>
        )}
      </div>
    </motion.div>
  );
}

function PasswordGate({
  onSubmit,
  pending,
  error,
}: {
  onSubmit: (password: string) => void;
  pending: boolean;
  error: string | null;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <p className="marketing-eyebrow">BNI Dabbers · Growth Workshop</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.02em] text-foreground">
        The visitor list
      </h1>
      <p className="mt-2 text-sm text-muted">
        Everyone we said we&rsquo;d invite, and who&rsquo;s inviting them. Members only
        — Harry has the password.
      </p>

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(value);
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-bold text-foreground">
            Password
          </span>
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-xl border-[1.5px] border-[#BDBDC1] bg-white px-4 py-3 text-base outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/25"
          />
        </label>
        {error ? (
          <p className="mt-3 rounded-xl bg-[#FDECEE] px-4 py-3 text-sm font-semibold text-[#A51A26]">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending || value.trim().length === 0}
          className="mt-4 w-full rounded-2xl bg-bni py-4 text-lg font-bold text-white disabled:opacity-50"
        >
          {pending ? "Checking…" : "Go in"}
        </button>
      </form>
    </div>
  );
}

function NamePicker({
  names,
  onPick,
  onSignOut,
}: {
  names: string[];
  onPick: (name: string) => void;
  onSignOut: () => void;
}) {
  const [query, setQuery] = useState("");
  const matches = [...new Set(names)].filter((n) =>
    normaliseText(n).includes(normaliseText(query)),
  );

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground">
        Which one are you?
      </h1>
      <p className="mt-1 text-sm text-muted">
        So the room can see who&rsquo;s inviting whom.
      </p>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Start typing your name…"
        className="mt-4 w-full rounded-xl border-[1.5px] border-[#BDBDC1] bg-white px-4 py-3 text-base outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/25"
      />
      <div className="mt-3 space-y-2">
        {names.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-white px-4 py-6 text-center text-sm text-muted">
            Loading the roster…
          </p>
        ) : null}
        {matches.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onPick(name)}
            className="w-full rounded-xl border-2 border-border bg-white px-4 py-3 text-left text-[15px] font-semibold text-foreground"
          >
            {name}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onSignOut}
        className="mt-5 w-full py-3 text-sm text-muted underline"
      >
        Sign out
      </button>
    </div>
  );
}
