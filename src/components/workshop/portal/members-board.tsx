"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
import { getTeam } from "@/lib/workshop/config";
import { normaliseText } from "@/lib/workshop/normalise";
import type { PortalContact } from "@/lib/workshop/portal";
import type { RosterMember } from "@/lib/workshop/roster";

/**
 * Who's got who: every member and the people they have taken on.
 *
 * The list answers "who can I invite"; this answers "who is already on it",
 * which is the question the room actually asks in the weeks after the
 * workshop. It is also the gentlest possible nudge — nobody is told off, but
 * an empty row is visible to everyone.
 */

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

type Row = {
  key: string;
  name: string;
  team: RosterMember["team"] | null;
  claimed: PortalContact[];
  invited: number;
};

export function MembersBoard({
  contacts,
  members,
  me,
  onOpen,
}: {
  contacts: PortalContact[];
  members: RosterMember[];
  me: string;
  onOpen: (id: string) => void;
}) {
  const mineKey = normaliseText(me);

  const { rows, idle, unclaimed } = useMemo(() => {
    const teamOf = new Map(members.map((m) => [normaliseText(m.name), m.team]));
    const byMember = new Map<string, Row>();
    const loose: PortalContact[] = [];

    for (const contact of contacts) {
      if (!contact.claimedBy) {
        loose.push(contact);
        continue;
      }
      const key = normaliseText(contact.claimedBy);
      const row =
        byMember.get(key) ??
        ({
          key,
          name: contact.claimedBy,
          team: teamOf.get(key) ?? null,
          claimed: [],
          invited: 0,
        } satisfies Row);
      row.claimed.push(contact);
      if (contact.invitedAt) row.invited += 1;
      byMember.set(key, row);
    }

    for (const row of byMember.values()) {
      row.claimed.sort((a, b) => a.contactName.localeCompare(b.contactName, "en-GB"));
    }

    return {
      rows: [...byMember.values()].sort(
        (a, b) => b.claimed.length - a.claimed.length || a.name.localeCompare(b.name, "en-GB"),
      ),
      idle: members
        .filter((m) => !byMember.has(normaliseText(m.name)))
        .sort((a, b) => a.name.localeCompare(b.name, "en-GB")),
      unclaimed: loose.sort((a, b) => a.contactName.localeCompare(b.contactName, "en-GB")),
    };
  }, [contacts, members]);

  const taken = contacts.length - unclaimed.length;
  const share = contacts.length === 0 ? 0 : taken / contacts.length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <p className="text-sm font-bold text-foreground">
            {taken} of {contacts.length} {contacts.length === 1 ? "name has" : "names have"}{" "}
            somebody on them
          </p>
          <p className="text-sm text-muted">
            {rows.length} {rows.length === 1 ? "member" : "members"} inviting
          </p>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-muted">
          <motion.div
            className="h-full rounded-full bg-bni"
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(share * 100)}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 24 }}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-white px-5 py-10 text-center text-sm text-muted">
          Nobody has taken anyone on yet. Be first.
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((row) => {
            const team = row.team ? getTeam(row.team) : null;
            const accent = team?.accent ?? "#9A9CA1";
            const isMe = row.key === mineKey;
            return (
              <motion.div
                key={row.key}
                layout
                className={`rounded-2xl border-2 bg-white p-4 ${
                  isMe ? "border-bni" : "border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                    style={{ background: accent }}
                  >
                    {initials(row.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[15px] font-bold text-foreground">
                        {row.name}
                      </span>
                      {isMe ? (
                        <span className="rounded-full bg-bni px-2 py-0.5 text-[10px] font-bold text-white">
                          YOU
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted">{team?.name ?? "No power team"}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-bold leading-none text-foreground">
                      {row.claimed.length}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                      claimed
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {row.claimed.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => onOpen(contact.id)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                        contact.invitedAt
                          ? "border-[#1F7A3E] bg-[#EAF6EE] text-[#1F7A3E]"
                          : "border-border bg-surface-muted text-foreground hover:border-foreground"
                      }`}
                    >
                      {contact.invitedAt ? "✓ " : ""}
                      {contact.contactName}
                    </button>
                  ))}
                </div>

                {row.invited > 0 ? (
                  <p className="mt-2.5 text-xs font-semibold text-[#1F7A3E]">
                    {row.invited} invited so far
                  </p>
                ) : (
                  <p className="mt-2.5 text-xs text-muted">None marked as invited yet</p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {unclaimed.length > 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-5">
          <p className="text-sm font-bold text-foreground">
            Nobody on these yet · {unclaimed.length}
          </p>
          <p className="mt-0.5 text-xs text-muted">Tap one to take it on.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {unclaimed.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => onOpen(contact.id)}
                className="rounded-full border border-border bg-white px-2.5 py-1 text-xs font-semibold text-muted transition hover:border-foreground hover:text-foreground"
              >
                {contact.contactName}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {idle.length > 0 ? (
        <div className="rounded-2xl bg-surface-muted p-5">
          <p className="text-sm font-bold text-foreground">
            Yet to take anyone on · {idle.length}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {idle.map((member) => (
              <span
                key={member.name}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  normaliseText(member.name) === mineKey
                    ? "bg-bni text-white"
                    : "bg-white text-muted"
                }`}
              >
                {member.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
