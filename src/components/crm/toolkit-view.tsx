"use client";

import { useMemo, useState } from "react";
import { WhatItIsWorth } from "@/components/crm/what-it-is-worth";
import type { ProjectionInputs } from "@/lib/crm/projections";
import {
  GRIP_STEPS,
  INVITE_TIPS,
  MESSAGE_RULES,
  MESSAGE_TEMPLATES,
  PODCASTS,
  PODCAST_HOME,
  type ChapterMessageFacts,
  type MessageTemplate,
  fillTemplate,
  isTradeOpen,
} from "@/lib/workshop/toolkit";

type Props = {
  meName: string;
  facts: ChapterMessageFacts;
  projections: ProjectionInputs;
};

/**
 * Everything a member needs in order to invite somebody, on one page.
 *
 * The messages are the reason to come here, so they are filled in live from
 * whoever you say you are writing to rather than shown with {{FirstName}}
 * still in them. Nobody copies a template with the brackets still in it on
 * purpose, but plenty of people do it by accident at 06:30.
 */
export function ToolkitView({ meName, facts, projections }: Props) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [trade, setTrade] = useState("");

  const person = useMemo(
    () => ({
      name: name.trim() || "Jane",
      company: company.trim() || null,
    }),
    [name, company],
  );

  // Nothing is filtered out here, unlike the visitor page. This is the
  // reference copy of all six, so the conditional one is shown with the
  // condition spelled out instead of quietly missing.
  const openSeat = isTradeOpen(trade, facts);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-5">
          <h1 className="text-xl font-bold text-foreground">Invite toolkit</h1>
          <p className="mt-0.5 text-sm text-muted">
            The messages, the rules behind them, and something to listen to on
            the way in. Everything here fills itself in with the chapter&rsquo;s
            real details.
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-white p-4">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
            The facts you get asked for
          </h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Fact label="Next meeting" value={facts.meetingDate} />
            <Fact
              label="Where"
              value={facts.venue}
            />
            <Fact
              label="When"
              value={`${facts.meetingStart} to ${facts.meetingEnd}`}
            />
            <Fact label="Members" value={`${facts.memberCount}, one per trade`} />
            <Fact
              label="Referrals passed in 12 months"
              value={facts.referralTotal || "Not published"}
            />
            <Fact label="What to call it" value={facts.groupName} />
          </dl>
        </section>

        <div className="mt-5">
          <WhatItIsWorth
            constants={projections.constants}
            pipelineCount={projections.pipelineCount}
          />
        </div>

        <section className="mt-5 rounded-2xl border border-border bg-white p-4">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
            Who are you writing to?
          </h2>
          <p className="mt-1 text-xs text-muted">
            Optional. Fill these in and every message below is ready to copy.
            Leave them and you get an example.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field
              label="Their name"
              value={name}
              onChange={setName}
              placeholder="Jane Fletcher"
            />
            <Field
              label="Their business"
              value={company}
              onChange={setCompany}
              placeholder="Fletcher Plumbing"
            />
            <Field
              label="Their trade"
              value={trade}
              onChange={setTrade}
              placeholder="Plumber"
            />
          </div>
          {trade.trim() ? (
            <p
              className={`mt-2 text-xs font-semibold ${
                openSeat ? "text-foreground" : "text-bni"
              }`}
            >
              {openSeat
                ? `Nobody in the room is down as ${trade.trim()}, so the empty-seat email is fair game.`
                : `${trade.trim()} is already a seat in the room, so don't send the empty-seat email.`}
            </p>
          ) : null}
        </section>

        <h2 className="mb-2 mt-7 text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
          The messages
        </h2>
        <div className="space-y-3">
          {MESSAGE_TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              text={fillTemplate(template, person, meName, facts)}
              blocked={
                template.openSeatOnly && openSeat !== true
                  ? trade.trim()
                    ? `Somebody already has the ${trade.trim()} seat. This one says the opposite.`
                    : "Put their trade in above. This one claims nobody in the room does what they do."
                  : template.needsReferralTotal && !facts.referralTotal
                    ? "No referral total is published, so there is no figure to quote."
                    : null
              }
            />
          ))}
        </div>

        <h2 className="mb-2 mt-7 text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
          GRIP, the order a first approach goes in
        </h2>
        <ol className="grid gap-2 sm:grid-cols-2">
          {GRIP_STEPS.map((step) => (
            <li
              key={step.letter}
              className="flex gap-3 rounded-xl border border-border bg-white p-3"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-bni text-xs font-bold text-white">
                {step.letter}
              </span>
              <span>
                <span className="block text-sm font-bold text-foreground">
                  {step.title}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {step.body}
                </span>
              </span>
            </li>
          ))}
        </ol>

        <h2 className="mb-2 mt-7 text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
          Rules for every message
        </h2>
        <ul className="space-y-1.5 rounded-2xl border border-border bg-white p-4">
          {MESSAGE_RULES.map((rule) => (
            <li
              key={rule}
              className="flex gap-2 text-sm leading-relaxed text-foreground"
            >
              <span aria-hidden="true" className="font-bold text-bni">
                &middot;
              </span>
              {rule}
            </li>
          ))}
        </ul>

        <h2 className="mb-2 mt-7 text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
          Six things that work
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {INVITE_TIPS.map((tip) => (
            <div
              key={tip.title}
              className="rounded-xl border border-border bg-white p-3"
            >
              <p className="text-sm font-bold text-foreground">{tip.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{tip.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mb-2 mt-7 text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
          Worth a listen
        </h2>
        <p className="mb-2 text-sm text-muted">
          From the official BNI podcast, all of them on inviting visitors. Most
          are under fifteen minutes.{" "}
          <a
            href={PODCAST_HOME}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground underline underline-offset-2"
          >
            The rest of the category
          </a>
          .
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {PODCASTS.map((cast) => (
            <a
              key={cast.episode}
              href={cast.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-border bg-white p-3 transition hover:border-bni"
            >
              <p className="text-sm font-bold text-foreground">
                <span className="text-bni">Ep {cast.episode}</span> ·{" "}
                {cast.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {cast.summary}
              </p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border-[1.5px] border-[#BDBDC1] bg-white px-3 py-2 text-base outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/25"
      />
    </label>
  );
}

function TemplateCard({
  template,
  text,
  blocked,
}: {
  template: MessageTemplate;
  text: string;
  blocked: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const overLimit = template.maxLength ? text.length > template.maxLength : false;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setFailed(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setFailed(true);
    }
  }

  return (
    <article className="rounded-2xl border border-border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
            {template.channel}
          </span>
          <p className="mt-1.5 text-sm font-bold text-foreground">
            {template.label}
          </p>
          <p className="text-xs text-muted">{template.hint}</p>
        </div>
        <button
          type="button"
          onClick={copy}
          disabled={Boolean(blocked)}
          className="rounded-lg bg-bni px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {blocked ? (
        <p className="mt-2 rounded-xl bg-surface-muted px-3 py-2 text-xs font-semibold leading-relaxed text-bni">
          {blocked}
        </p>
      ) : null}

      <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-surface-muted px-3 py-3 font-sans text-[13px] leading-relaxed text-foreground">
        {text}
      </pre>

      {template.maxLength ? (
        <p
          className={`mt-1.5 text-[11px] font-semibold ${
            overLimit ? "text-bni" : "text-ink-muted"
          }`}
        >
          {text.length} of {template.maxLength} characters
          {overLimit ? " · too long, trim it before you send" : ""}
        </p>
      ) : null}

      {failed ? (
        <p role="alert" className="mt-2 text-xs font-semibold text-bni">
          Couldn&rsquo;t copy it. Select the text above and copy it by hand.
        </p>
      ) : null}
    </article>
  );
}
