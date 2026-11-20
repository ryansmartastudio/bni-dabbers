"use client";

import { useState } from "react";
import {
  MESSAGE_TEMPLATES,
  fillTemplate,
  type MessageTemplate,
} from "@/lib/workshop/toolkit";

type Props = {
  person: { name: string; company?: string | null };
  me: string;
  meetingLabel: string;
  className?: string;
};

/**
 * Something to send.
 *
 * Shared by the visitor page and the "not yet" page a reminder leads to,
 * because the moment someone admits they haven't invited anybody is exactly
 * the moment to hand them the words.
 */
export function MessagePicker({ person, me, meetingLabel, className }: Props) {
  const [template, setTemplate] = useState<MessageTemplate>(MESSAGE_TEMPLATES[0]!);
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const message = fillTemplate(template, person, me, meetingLabel);

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
        onChange={(event) =>
          setTemplate(
            MESSAGE_TEMPLATES.find((item) => item.id === event.target.value) ??
              MESSAGE_TEMPLATES[0]!,
          )
        }
        aria-label="Which message"
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
