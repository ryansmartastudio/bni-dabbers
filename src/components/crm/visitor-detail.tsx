"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addNote, claimForMe, moveVisitor, releaseMine } from "@/actions/crm";
import {
  CRM_STAGES,
  STAGE_LABELS,
  type CrmStage,
  type DuplicateMatch,
} from "@/lib/crm/visitors";
import {
  INVITE_TIPS,
  MESSAGE_TEMPLATES,
  fillTemplate,
  type MessageTemplate,
} from "@/lib/workshop/toolkit";

type Visitor = {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  category: string | null;
  stage: CrmStage;
  ownerMemberId: string | null;
  ownerClaimedAt: string | null;
  invitedAt: string | null;
  visitBookedFor: string | null;
  createdAt: string;
};

type TimelineEntry = {
  id: string;
  kind: string;
  body: string;
  authorName: string | null;
  createdAt: string;
};

type Props = {
  visitor: Visitor;
  timeline: TimelineEntry[];
  duplicates: DuplicateMatch[];
  meId: string;
  meName: string;
  meetingLabel: string;
};

const KIND_LABELS: Record<string, string> = {
  note: "Note",
  stage_change: "Moved",
  claim: "Claimed",
  release: "Released",
  reminder_sent: "Reminder sent",
  reminder_answered: "Reminder answered",
  system: "History",
};

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * One visitor, one page.
 *
 * The timeline is the heart of it: notes people write and things the system
 * did, in one chronological story. A feedback, a rejection, a visit date and
 * "released back to the pool" all belong in the same list, because what you
 * want when you open this is to know what has happened to this person.
 */
export function VisitorDetail({
  visitor,
  timeline,
  duplicates,
  meId,
  meName,
  meetingLabel,
}: Props) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<MessageTemplate>(MESSAGE_TEMPLATES[0]!);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const isMine = visitor.ownerMemberId === meId;
  const canMove = !visitor.ownerMemberId || isMine;

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "That didn't work.");
    });
  }

  const message = fillTemplate(
    template,
    { name: visitor.name, company: visitor.company },
    meName,
    meetingLabel,
  );

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Couldn't copy it. Select the text and copy it by hand.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/crm"
        className="text-sm font-semibold text-muted underline-offset-2 hover:underline"
      >
        &larr; Back to the pipeline
      </Link>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">{visitor.name}</h1>
          <p className="mt-0.5 text-sm text-muted">
            {[visitor.company, visitor.category].filter(Boolean).join(" · ") ||
              "No company recorded"}
          </p>
        </div>
        <span className="rounded-xl bg-surface-muted px-3 py-1.5 text-sm font-bold text-foreground">
          {STAGE_LABELS[visitor.stage]}
        </span>
      </header>

      {duplicates.length > 0 ? (
        <aside className="mt-4 rounded-2xl border border-border bg-surface-muted p-3">
          <p className="text-sm font-bold text-foreground">
            {duplicates.length === 1
              ? "This might be the same person as"
              : "This might be the same person as any of"}
          </p>
          <ul className="mt-1.5 space-y-1">
            {duplicates.map((dupe) => (
              <li key={dupe.id} className="text-sm">
                <Link
                  href={`/crm/visitor/${dupe.id}`}
                  className="font-semibold text-foreground underline underline-offset-2"
                >
                  {dupe.name}
                </Link>
                <span className="text-muted">
                  {dupe.company ? ` · ${dupe.company}` : ""} ·{" "}
                  {STAGE_LABELS[dupe.stage]}
                  {dupe.sourceLabel ? ` · from ${dupe.sourceLabel}` : ""}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-muted">
            Records are kept separate on purpose. Worth a look before you ring
            them, so two of you don&rsquo;t invite the same person.
          </p>
        </aside>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 text-sm font-semibold text-bni">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 md:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-white p-4">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
              Add to the timeline
            </h2>
            <p className="mt-1 text-xs text-muted">
              Feedback, a rejection, a visit date, anything useful. Anyone in the
              chapter can add a note, whoever has them.
            </p>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="Spoke to him at the game on Saturday — keen, but away until the 8th."
              className="mt-2 w-full rounded-xl border-[1.5px] border-[#BDBDC1] bg-white px-3 py-2.5 text-base outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/25"
            />
            <button
              type="button"
              disabled={pending || !note.trim()}
              onClick={() =>
                run(async () => {
                  const result = await addNote(visitor.id, note);
                  if (result.ok) setNote("");
                  return result;
                })
              }
              className="mt-2 rounded-xl bg-bni px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              Add note
            </button>
          </section>

          <section>
            <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
              History
            </h2>
            {timeline.length === 0 ? (
              <p className="rounded-2xl border border-border bg-white p-4 text-sm text-muted">
                Nothing yet. The first note you add shows up here.
              </p>
            ) : (
              <ol className="space-y-2">
                {timeline.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-xl border border-border bg-white p-3"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted">
                      {KIND_LABELS[entry.kind] ?? entry.kind}
                      <span className="ml-2 font-semibold normal-case tracking-normal text-muted">
                        {entry.authorName ?? "Automatic"} · {when(entry.createdAt)}
                      </span>
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground">
                      {entry.body}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-border bg-white p-4">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
              Who has them
            </h2>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {isMine ? "You do" : visitor.ownerMemberId ? "Another member" : "Nobody yet"}
            </p>

            {!visitor.ownerMemberId ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => claimForMe(visitor.id))}
                className="mt-2 w-full rounded-xl bg-bni px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                I&rsquo;ll invite them
              </button>
            ) : null}
            {isMine ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => releaseMine(visitor.id))}
                className="mt-2 w-full rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground disabled:opacity-60"
              >
                Release back to the pool
              </button>
            ) : null}

            {canMove ? (
              <label className="mt-3 block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted">
                  Stage
                </span>
                <select
                  value={visitor.stage}
                  disabled={pending}
                  onChange={(event) => run(() => moveVisitor(visitor.id, event.target.value))}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground"
                >
                  {CRM_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {STAGE_LABELS[stage]}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </section>

          <section className="rounded-2xl border border-border bg-white p-4">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
              Details
            </h2>
            <dl className="mt-2 space-y-1.5 text-sm">
              {(
                [
                  ["Phone", visitor.phone, visitor.phone ? `tel:${visitor.phone}` : null],
                  ["Email", visitor.email, visitor.email ? `mailto:${visitor.email}` : null],
                  ["Website", visitor.website, visitor.website],
                ] as const
              ).map(([label, value, href]) => (
                <div key={label}>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted">
                    {label}
                  </dt>
                  <dd className="break-words text-foreground">
                    {value ? (
                      href ? (
                        <a className="underline underline-offset-2" href={href}>
                          {value}
                        </a>
                      ) : (
                        value
                      )
                    ) : (
                      <span className="text-ink-muted">Not recorded</span>
                    )}
                  </dd>
                </div>
              ))}
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted">
                  Added
                </dt>
                <dd className="text-foreground">{when(visitor.createdAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-white p-4">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
              Something to send
            </h2>
            <select
              value={template.id}
              onChange={(event) =>
                setTemplate(
                  MESSAGE_TEMPLATES.find((item) => item.id === event.target.value) ??
                    MESSAGE_TEMPLATES[0]!,
                )
              }
              className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground"
            >
              {MESSAGE_TEMPLATES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.channel} · {item.label}
                </option>
              ))}
            </select>
            <p className="mt-2 whitespace-pre-wrap rounded-xl bg-surface-muted p-2.5 text-xs leading-relaxed text-foreground">
              {message}
            </p>
            <button
              type="button"
              onClick={copyMessage}
              className="mt-2 w-full rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground"
            >
              {copied ? "Copied" : "Copy message"}
            </button>
          </section>

          <section className="rounded-2xl border border-border bg-white p-4">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
              Worth remembering
            </h2>
            <ul className="mt-2 space-y-2">
              {INVITE_TIPS.slice(0, 3).map((tip) => (
                <li key={tip.title}>
                  <p className="text-sm font-bold text-foreground">{tip.title}</p>
                  <p className="text-xs leading-relaxed text-muted">{tip.body}</p>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
