"use client";

import { useState } from "react";
import type { WorkshopConstants } from "@/lib/workshop/config";
import {
  formatCount,
  formatMoney,
  projectMemberValue,
  projectNetwork,
} from "@/lib/workshop/projections";

/**
 * The workshop's closing sums, against the pipeline as it stands.
 *
 * Harry asked for these back after the day, and the interesting change is
 * the starting number: at the workshop it was a figure you typed to imagine
 * a list, and here the list exists. It opens on the real count, so the first
 * thing it says is what this chapter's actual pipeline is worth if they work
 * it, not what a hypothetical one would be.
 *
 * The rates are the workshop's, because they are the chapter's own PALMS
 * figures and nothing live replaces them. The head count and the referral
 * total are the live ones, so this page cannot contradict the figures three
 * sections above it.
 */
export function WhatItIsWorth({
  constants,
  pipelineCount,
}: {
  constants: WorkshopConstants;
  pipelineCount: number;
}) {
  const [contacts, setContacts] = useState<number>(pipelineCount);
  const network = projectNetwork(contacts, constants);
  const value = projectMemberValue(contacts, constants);
  const atPipeline = contacts === pipelineCount;

  return (
    <section className="rounded-2xl border border-border bg-white p-4">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
        What this means for Dabbers
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        The sums from the workshop, run against the pipeline as it stands
        today. Change the number to see what a longer list would do.
      </p>

      <label className="mt-3 block">
        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted">
          People in the pipeline
        </span>
        <span className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={contacts}
            onChange={(event) => {
              const next = Number(event.target.value);
              setContacts(Number.isFinite(next) && next >= 0 ? next : 0);
            }}
            className="w-28 rounded-xl border-[1.5px] border-[#BDBDC1] bg-white px-3 py-2 text-base outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/25"
          />
          {atPipeline ? (
            <span className="text-xs font-semibold text-muted">
              what you have right now
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setContacts(pipelineCount)}
              className="text-xs font-bold text-foreground underline underline-offset-2"
            >
              Back to the real {pipelineCount}
            </button>
          )}
        </span>
      </label>

      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Figure label="Visitors" value={formatCount(network.visitors)} />
        <Figure label="New members" value={formatCount(network.newMembers)} />
        <Figure label="Chapter" value={`${network.membersAfter}`} />
        <Figure
          label="Connections"
          value={`${formatCount(network.connectionsAfter)}`}
          note={`+${Math.round(network.connectionsGrowthPct)}%`}
        />
      </dl>

      <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {value.rows.map((row) => (
          <Figure
            key={row.key}
            label={row.label}
            value={`+${row.money ? formatMoney(row.delta) : formatCount(row.delta)}`}
            note="a year"
            accent
          />
        ))}
      </dl>

      <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
        On the chapter&rsquo;s own PALMS figures:{" "}
        {Math.round(constants.visitorRate * 100)}% of the people on this list
        visiting, and {(constants.conversionRate * 100).toFixed(1)}% of those
        visitors joining. Counted from {constants.membersToday} members today.
      </p>
    </section>
  );
}

function Figure({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 ${
        accent ? "border-bni/30 bg-surface-muted" : "border-border"
      }`}
    >
      <dt className="text-[11px] font-semibold text-muted">{label}</dt>
      <dd
        className={`mt-0.5 text-lg font-bold tabular-nums leading-none ${
          accent ? "text-bni" : "text-foreground"
        }`}
      >
        {value}
        {note ? (
          <span className="ml-1 text-[11px] font-semibold text-muted">
            {note}
          </span>
        ) : null}
      </dd>
    </div>
  );
}
