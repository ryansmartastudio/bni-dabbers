"use client";

import { useMemo, useState } from "react";
import {
  fillTemplate,
  listTemplates,
  type ChapterMessageFacts,
  type MessageTemplate,
} from "@/lib/workshop/toolkit";

type Props = {
  person: { name: string; company?: string | null };
  me: string;
  facts: ChapterMessageFacts;
  /** Their trade, which decides whether the empty-seat email is honest. */
  category?: string | null;
  className?: string;
};

/**
 * Something to send.
 *
 * Shared by the visitor page and the "not yet" page a reminder leads to,
 * because the moment someone admits they haven't invited anybody is exactly
 * the moment to hand them the words.
 */
export function MessagePicker({
  person,
  me,
  facts,
  category,
  className,
}: Props) {
  const templates = useMemo(
    () => listTemplates(facts, { category }),
    [facts, category],
  );
  const [chosenId, setChosenId] = useState<string>(templates[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  // Resolved from the id rather than held as an object, so a template that
  // drops off the list -- the trade got filled, the referral total went away
  // -- falls back instead of rendering a message that is no longer offered.
  const template: MessageTemplate | undefined =
    templates.find((item) => item.id === chosenId) ?? templates[0];

  if (!template) return null;

  const message = fillTemplate(template, person, me, facts);
  const overLimit = template.maxLength
    ? message.length > template.maxLength
    : false;

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setFailed(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setFailed(true);
    }
  }

  return (
    <section className={className ?? "rounded-2xl border border-border bg-white p-4"}>
      <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
        Something to send
      </h2>
      <select
        value={template.id}
        onChange={(event) => setChosenId(event.target.value)}
        aria-label="Which message"
        className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground"
      >
        {templates.map((item) => (
          <option key={item.id} value={item.id}>
            {item.channel} · {item.label}
          </option>
        ))}
      </select>
      <p className="mt-2 whitespace-pre-wrap rounded-xl bg-surface-muted p-2.5 text-xs leading-relaxed text-foreground">
        {message}
      </p>
      {template.maxLength ? (
        <p
          className={`mt-1.5 text-[11px] font-semibold ${
            overLimit ? "text-bni" : "text-ink-muted"
          }`}
        >
          {message.length} of {template.maxLength} characters
          {overLimit ? " · too long, trim it before you send" : ""}
        </p>
      ) : null}
      <button
        type="button"
        onClick={copy}
        className="mt-2 w-full rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground"
      >
        {copied ? "Copied" : "Copy message"}
      </button>
      {failed ? (
        <p role="alert" className="mt-2 text-xs font-semibold text-bni">
          Couldn&rsquo;t copy it. Select the text above and copy it by hand.
        </p>
      ) : null}
    </section>
  );
}
