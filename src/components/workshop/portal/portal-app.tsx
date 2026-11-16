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
import { MembersBoard, initials } from "@/components/workshop/portal/members-board";
import { usePortalSession } from "@/components/workshop/portal/portal-store";
import { TEAMS, getTeam } from "@/lib/workshop/config";
import { normaliseText } from "@/lib/workshop/normalise";
import type {
  PortalContact,
  PortalSessionSummary,
  PortalStats,
} from "@/lib/workshop/portal";
import type { RosterMember } from "@/lib/workshop/roster";
import type { WorkshopConstants } from "@/lib/workshop/config";

const REFRESH_MS = 6000;

type Filter = "all" | "unclaimed" | "mine" | "invited";
type Tab = "names" | "map" | "members";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "unclaimed", label: "Up for grabs" },
  { id: "mine", label: "Mine" },
  { id: "invited", label: "Invited" },
  { id: "all", label: "Everyone" },
];

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "names", label: "The names" },
  { id: "map", label: "Invite map" },
  { id: "members", label: "Who's got who" },
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
  const [members, setMembers] = useState<RosterMember[]>([]);
  const [stats, setStats] = useState<PortalStats | null>(null);
  const [sessions, setSessions] = useState<PortalSessionSummary[]>([]);
  // What the server resolved; `wanted` is what this page is asking for, which
  // starts as whatever the link carried.
  const [wanted, setWanted] = useState<string | null>(requestedSessionId);
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  // The map is the overview, so it is what the portal opens on.
  const [tab, setTab] = useState<Tab>("map");
  const [filter, setFilter] = useState<Filter>("unclaimed");
  const [activeSeat, setActiveSeat] = useState<string | null>(null);
  const [activeMember, setActiveMember] = useState<string | null>(null);
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
      setMembers(result.data.members);
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
      setMembers(result.data.members);
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
    setActiveMember(null);
    setOpenId(null);
    setContacts([]);
    setStats(null);
    try {
      window.history.replaceState(null, "", `?s=${id}`);
    } catch {
      // Not worth failing the switch over.
    }
  }

  /** Jump to the list already filtered — what every stat card is really for. */
  function showNames(next: Filter) {
    setFilter(next);
    setTab("names");
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
        members={members}
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

  /** Opening a contact from the map or the board should show it, wherever. */
  const openContact = (id: string) => setOpenId(id);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-24 pt-6 sm:px-6 lg:px-8">
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

      {stats ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Contacts" value={stats.total} onClick={() => showNames("all")} />
          <Stat label="Claimed" value={stats.claimed} onClick={() => setTab("members")} />
          <Stat label="Yours" value={stats.mine} accent onClick={() => showNames("mine")} />
          <Stat label="Invited" value={stats.invited} onClick={() => showNames("invited")} />
        </div>
      ) : null}

      {/* One tab bar at every width: the map earns a full-width page of its
          own rather than a column that only exists on a big screen. */}
      <div className="sticky top-0 z-10 -mx-4 mt-5 bg-background/92 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative flex-1 whitespace-nowrap rounded-lg px-2 py-2.5 text-[13px] font-bold transition sm:flex-none sm:px-4 sm:text-sm ${
                tab === t.id ? "text-white" : "text-muted hover:text-foreground"
              }`}
            >
              {tab === t.id ? (
                <motion.span
                  layoutId="portal-tab"
                  // Without this the pill animates in from wherever Motion
                  // first measured it, which on mount is nowhere useful.
                  initial={false}
                  className="absolute inset-0 rounded-lg bg-bni"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl bg-[#FDECEE] px-4 py-3 text-sm font-semibold text-[#A51A26]">
          {error}
        </p>
      ) : null}

      <div className="mt-4">
        {tab === "names" ? (
          <>
            <label className="block">
              <span className="sr-only">Search the list</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, company, seat or who claimed it…"
                className="w-full rounded-xl border-[1.5px] border-[#BDBDC1] bg-white px-4 py-3 text-base outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/25"
              />
            </label>

            <div className="mt-3 flex flex-wrap items-center gap-2">
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
              {activeSeat && seatLabel ? (
                <button
                  type="button"
                  onClick={() => setActiveSeat(null)}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-white px-3.5 py-[7px] text-sm font-semibold text-foreground"
                >
                  {seatLabel}
                  <span className="text-muted">✕</span>
                </button>
              ) : null}
            </div>

            <p className="mt-4 text-sm text-muted">
              Showing {visible.length} of {contacts.length}
              {filter === "unclaimed" ? " · nobody has taken these on yet" : ""}
            </p>

            <div className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
              {visible.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-white px-5 py-10 text-center md:col-span-2 xl:col-span-3">
                  <p className="text-sm text-muted">Nothing matches that.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setActiveSeat(null);
                      setFilter("all");
                    }}
                    className="mt-3 rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-white"
                  >
                    Show everyone
                  </button>
                </div>
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
          </>
        ) : null}

        {tab === "map" ? (
          <div className="rounded-3xl border border-border bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">The invite map</p>
                <p className="text-xs text-muted">
                  Hover or tap for the full name. Pinch or scroll to zoom, drag to move.
                </p>
              </div>
              {activeSeat || activeMember ? (
                <div className="flex items-center gap-2">
                  {activeSeat && seatLabel ? (
                    <button
                      type="button"
                      onClick={() => showNames("all")}
                      className="rounded-full bg-bni px-3.5 py-2 text-xs font-bold text-white"
                    >
                      See the {visible.length} in {seatLabel}
                    </button>
                  ) : null}
                  {activeMember ? (
                    <span className="rounded-full bg-foreground px-3.5 py-2 text-xs font-bold text-white">
                      {activeMember}&rsquo;s names
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSeat(null);
                      setActiveMember(null);
                    }}
                    className="rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-muted"
                  >
                    Clear
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mt-2 gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_17rem] xl:items-start">
              <ContactMap
                contacts={contacts}
                me={me}
                activeSeat={activeSeat}
                activeMember={activeMember}
                onSeat={setActiveSeat}
                onOpen={openContact}
                reduced={reduced}
              />
              <MapSidebar
                contacts={contacts}
                members={members}
                me={me}
                activeSeat={activeSeat}
                activeMember={activeMember}
                onSeat={setActiveSeat}
                onMember={setActiveMember}
                onOpen={openContact}
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
        ) : null}

        {tab === "members" ? (
          <MembersBoard contacts={contacts} members={members} me={me} onOpen={openContact} />
        ) : null}
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

type SidebarView = "members" | "names" | "categories";

/**
 * The panel beside the map.
 *
 * Members first, because the question people bring to the map is "who has
 * already got someone" — picking one lights up just their names. The names
 * themselves and the categories are a tap away, and both follow whatever the
 * map is focused on, so picking a member and switching to Names gives you
 * their list.
 */
function MapSidebar({
  contacts,
  members,
  me,
  activeSeat,
  activeMember,
  onSeat,
  onMember,
  onOpen,
}: {
  contacts: PortalContact[];
  members: RosterMember[];
  me: string;
  activeSeat: string | null;
  activeMember: string | null;
  onSeat: (key: string | null) => void;
  onMember: (name: string | null) => void;
  onOpen: (id: string) => void;
}) {
  const [view, setView] = useState<SidebarView>("members");
  const mineKey = normaliseText(me);

  const rows = useMemo(() => {
    const counts = new Map<string, { claimed: number; invited: number; name: string }>();
    for (const contact of contacts) {
      if (!contact.claimedBy) continue;
      const key = normaliseText(contact.claimedBy);
      const row = counts.get(key) ?? { claimed: 0, invited: 0, name: contact.claimedBy };
      row.claimed += 1;
      if (contact.invitedAt) row.invited += 1;
      counts.set(key, row);
    }

    // Everyone on the roster appears, not only the ones who have claimed: the
    // gaps are the useful part of the list.
    const seen = new Set<string>();
    const all = members.map((member) => {
      const key = normaliseText(member.name);
      seen.add(key);
      const row = counts.get(key);
      return {
        key,
        name: member.name,
        accent: getTeam(member.team)?.accent ?? "#9A9CA1",
        claimed: row?.claimed ?? 0,
        invited: row?.invited ?? 0,
      };
    });

    // Anyone who claimed but is no longer on the roster still has names out.
    for (const [key, row] of counts) {
      if (seen.has(key)) continue;
      all.push({ key, name: row.name, accent: "#9A9CA1", claimed: row.claimed, invited: row.invited });
    }

    return all.sort(
      (a, b) => b.claimed - a.claimed || a.name.localeCompare(b.name, "en-GB"),
    );
  }, [contacts, members]);

  return (
    <div className="mt-5 xl:mt-0">
      <div className="flex gap-1 rounded-lg bg-surface-muted p-1">
        {(["members", "names", "categories"] as SidebarView[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] transition ${
              view === id ? "bg-white text-foreground shadow-sm" : "text-ink-muted"
            }`}
          >
            {id}
          </button>
        ))}
      </div>

      {view === "members" ? (
        <>
          <div className="mt-2 flex flex-wrap gap-1.5 xl:max-h-[62vh] xl:flex-col xl:flex-nowrap xl:gap-1 xl:overflow-y-auto xl:pr-1">
            {rows.map((row) => {
              const active = activeMember === row.name;
              const idle = row.claimed === 0;
              return (
                <button
                  key={row.key}
                  type="button"
                  disabled={idle}
                  onClick={() => onMember(active ? null : row.name)}
                  className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition xl:w-full ${
                    active
                      ? "border-foreground bg-foreground text-white"
                      : idle
                        ? "border-transparent bg-transparent text-ink-muted"
                        : "border-border bg-white text-foreground hover:border-foreground"
                  }`}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ background: idle ? "#C9C6C1" : row.accent }}
                  >
                    {initials(row.name)}
                  </span>
                  <span className="truncate font-semibold">
                    {row.name}
                    {row.key === mineKey ? " (you)" : ""}
                  </span>
                  <span
                    className={`ml-auto shrink-0 tabular-nums ${
                      active ? "text-white/70" : "text-ink-muted"
                    }`}
                  >
                    {row.invited > 0 ? `${row.invited}✓ ` : ""}
                    {row.claimed}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-ink-muted">
            Invited ✓ / claimed. Pick someone to light up their names.
          </p>
        </>
      ) : view === "names" ? (
        <NameList
          contacts={contacts}
          me={me}
          activeSeat={activeSeat}
          activeMember={activeMember}
          onOpen={onOpen}
        />
      ) : (
        <CategoryList contacts={contacts} activeSeat={activeSeat} onSeat={onSeat} />
      )}
    </div>
  );
}

/**
 * Every name on the map, as a list.
 *
 * It follows the map's focus rather than ignoring it: pick a member or a
 * category and this becomes their list, which is the pairing that makes the
 * map worth looking at rather than just pretty.
 */
function NameList({
  contacts,
  me,
  activeSeat,
  activeMember,
  onOpen,
}: {
  contacts: PortalContact[];
  me: string;
  activeSeat: string | null;
  activeMember: string | null;
  onOpen: (id: string) => void;
}) {
  const mineKey = normaliseText(me);
  const memberFocus = activeMember ? normaliseText(activeMember) : null;

  const rows = useMemo(() => {
    return contacts
      .filter((c) => {
        if (activeSeat && seatKeyOf(c) !== activeSeat) return false;
        if (memberFocus && normaliseText(c.claimedBy ?? "") !== memberFocus) return false;
        return true;
      })
      .sort((a, b) => a.contactName.localeCompare(b.contactName, "en-GB"));
  }, [contacts, activeSeat, memberFocus]);

  if (rows.length === 0) {
    return (
      <p className="mt-3 rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted">
        No names in this selection.
      </p>
    );
  }

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-1.5 xl:max-h-[62vh] xl:flex-col xl:flex-nowrap xl:gap-1 xl:overflow-y-auto xl:pr-1">
        {rows.map((contact) => {
          const mine = normaliseText(contact.claimedBy ?? "") === mineKey;
          const accent =
            (contact.seatTeam ? getTeam(contact.seatTeam)?.accent : null) ?? "#9A9CA1";
          return (
            <button
              key={contact.id}
              type="button"
              onClick={() => onOpen(contact.id)}
              className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition xl:w-full ${
                mine
                  ? "border-bni bg-[#FDF1F2] text-foreground"
                  : "border-border bg-white text-foreground hover:border-foreground"
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full border-2"
                style={{
                  borderColor: mine ? "#CF2030" : accent,
                  background: contact.claimedBy ? (mine ? "#CF2030" : accent) : "#FFFFFF",
                }}
              />
              <span className="min-w-0">
                <span className="block truncate font-semibold">{contact.contactName}</span>
                <span className="block truncate text-[10px] text-ink-muted">
                  {contact.claimedBy
                    ? mine
                      ? "Yours"
                      : contact.claimedBy
                    : (contact.company || contact.seat)}
                </span>
              </span>
              {contact.invitedAt ? (
                <span className="ml-auto shrink-0 text-[11px] font-bold text-[#1F7A3E]">✓</span>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-ink-muted">
        {rows.length} {rows.length === 1 ? "name" : "names"} · tap one to open it
      </p>
    </>
  );
}

type CategoryRow = {
  key: string;
  label: string;
  accent: string;
  total: number;
  claimed: number;
};

function CategoryList({
  contacts,
  activeSeat,
  onSeat,
}: {
  contacts: PortalContact[];
  activeSeat: string | null;
  onSeat: (key: string | null) => void;
}) {
  const rows = useMemo(() => {
    const byKey = new Map<string, CategoryRow>();
    for (const contact of contacts) {
      const key = seatKeyOf(contact);
      const row =
        byKey.get(key) ??
        ({
          key,
          label: contact.seat || "Other",
          accent: (contact.seatTeam ? getTeam(contact.seatTeam)?.accent : null) ?? "#9A9CA1",
          total: 0,
          claimed: 0,
        } satisfies CategoryRow);
      row.total += 1;
      if (contact.claimedBy) row.claimed += 1;
      byKey.set(key, row);
    }
    return [...byKey.values()].sort(
      (a, b) => b.total - a.total || a.label.localeCompare(b.label, "en-GB"),
    );
  }, [contacts]);

  if (rows.length === 0) return null;

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-1.5 xl:max-h-[62vh] xl:flex-col xl:flex-nowrap xl:gap-1 xl:overflow-y-auto xl:pr-1">
        {rows.map((row) => {
          const active = activeSeat === row.key;
          return (
            <button
              key={row.key}
              type="button"
              onClick={() => onSeat(active ? null : row.key)}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs transition xl:w-full ${
                active
                  ? "border-foreground bg-foreground text-white"
                  : "border-border bg-white text-foreground hover:border-foreground"
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: active ? "#FFFFFF" : row.accent }}
              />
              <span className="truncate font-semibold">{row.label}</span>
              <span
                className={`ml-auto shrink-0 tabular-nums ${active ? "text-white/70" : "text-ink-muted"}`}
              >
                {row.total - row.claimed}/{row.total}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-ink-muted">Up for grabs / total</p>
    </>
  );
}

function Stat({
  label,
  value,
  accent,
  onClick,
}: {
  label: string;
  value: number;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2.5 text-center transition hover:ring-2 hover:ring-bni/30 ${
        accent ? "bg-[#FDF1F2]" : "bg-surface-muted"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
        {label}
      </p>
      <p className={`mt-0.5 text-xl font-bold ${accent ? "text-bni" : "text-foreground"}`}>
        {value}
      </p>
    </button>
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
      className={`flex flex-col rounded-2xl border-2 bg-white p-4 transition-shadow hover:shadow-[0_6px_24px_rgba(0,0,0,0.07)] ${
        mine ? "border-bni" : contact.claimedBy ? "border-border opacity-80" : "border-border"
      }`}
    >
      <button type="button" onClick={onOpen} className="block w-full flex-1 text-left">
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

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
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
  members,
  onPick,
  onSignOut,
}: {
  members: RosterMember[];
  onPick: (name: string) => void;
  onSignOut: () => void;
}) {
  const [query, setQuery] = useState("");
  const names = [...new Set(members.map((m) => m.name))];
  const matches = names.filter((n) => normaliseText(n).includes(normaliseText(query)));

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
