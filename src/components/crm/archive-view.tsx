"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { restoreToChapter } from "@/actions/crm";
import { STAGE_LABELS, type PipelineVisitor } from "@/lib/crm/visitors";

function when(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ArchiveView({ visitors }: { visitors: PipelineVisitor[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function restore(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await restoreToChapter(id);
      if (!result.ok) setError(result.error ?? "That didn't work.");
    });
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-5">
          <h1 className="text-xl font-bold text-foreground">Archive</h1>
          <p className="mt-0.5 text-sm text-muted">
            Off the board and out of the reminders, but not forgotten. They
            still raise a warning if somebody adds them again.
          </p>
        </header>

        {error ? (
          <p role="alert" className="mb-4 text-sm font-semibold text-bni">
            {error}
          </p>
        ) : null}

        {visitors.length === 0 ? (
          <p className="rounded-2xl border border-border bg-white p-4 text-sm text-muted">
            Nothing archived. When somebody is no longer worth chasing, archive
            them from their own page and they will appear here.
          </p>
        ) : (
          <ul className={`space-y-2 ${pending ? "opacity-60" : ""}`}>
            {visitors.map((visitor) => (
              <li
                key={visitor.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/crm/visitor/${visitor.id}`}
                    className="text-sm font-bold text-foreground underline-offset-2 hover:underline"
                  >
                    {visitor.name}
                  </Link>
                  <p className="text-xs text-muted">
                    {[visitor.company, visitor.category]
                      .filter(Boolean)
                      .join(" · ") || "No company recorded"}
                    {" · "}
                    {STAGE_LABELS[visitor.stage]} when archived
                    {visitor.archivedAt ? ` · ${when(visitor.archivedAt)}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => restore(visitor.id)}
                  className="shrink-0 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground disabled:opacity-60"
                >
                  Put back
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
