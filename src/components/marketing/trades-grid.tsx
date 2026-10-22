"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type TradeGridItem = {
  slug: string;
  seatLabel: string;
  memberCount: number;
};

type TradesGridProps = {
  groups: TradeGridItem[];
};

export function TradesGrid({ groups }: TradesGridProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return groups;
    return groups.filter((group) =>
      group.seatLabel.toLowerCase().includes(normalized),
    );
  }, [groups, query]);

  return (
    <section className="border-t border-border bg-surface-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-foreground">
            Browse by category
          </h2>
          <p className="mt-3 text-base text-muted">
            Search for a trade or scroll the full list of BNI seats represented in the chapter.
          </p>
        </div>

        <label className="mt-8 block max-w-md">
          <span className="sr-only">Search trades</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search trades…"
            className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-foreground shadow-[0_12px_32px_-28px_rgba(23,20,18,0.35)] outline-none transition placeholder:text-ink-muted focus:border-[color-mix(in_srgb,var(--color-bni-red)_40%,var(--color-border))] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-bni-red)_18%,transparent)]"
          />
        </label>

        {filtered.length === 0 ? (
          <p className="mt-10 text-muted">
            No trades match &ldquo;{query.trim()}&rdquo;. Try a different search or{" "}
            <Link href="/directory" className="font-semibold text-bni hover:underline">
              browse all members
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((group) => (
              <li key={group.slug}>
                <Link
                  href={`/trades/${group.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-[0_18px_40px_-34px_rgba(23,20,18,0.45)] transition hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--color-bni-red)_35%,var(--color-border))]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
                      BNI category
                    </p>
                    <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
                      {group.memberCount}
                    </span>
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-foreground group-hover:text-bni">
                    {group.seatLabel}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {group.memberCount === 1
                      ? "View the chapter member in this seat."
                      : `${group.memberCount} members — view profiles`}
                  </p>
                  <span className="mt-4 inline-flex text-sm font-semibold text-bni">
                    View trade →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
