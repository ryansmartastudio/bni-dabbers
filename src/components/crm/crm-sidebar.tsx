"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useState } from "react";
import { AddVisitor } from "@/components/crm/add-visitor";

type Counts = {
  all: number;
  mine: number;
  unclaimed: number;
  needsChasing: number;
  archived: number;
};

type Props = {
  meName: string;
  chapterName: string;
  counts: Counts;
  isAdmin: boolean;
};

const SCOPES = [
  { key: "all", label: "All visitors" },
  { key: "mine", label: "Mine" },
  { key: "unclaimed", label: "Unclaimed" },
] as const;

/**
 * The CRM's own navigation.
 *
 * This is a tool people live in for a few minutes at a time, not a page of a
 * marketing site, so it gets a sidebar that says where you are and what is
 * waiting. Scope lives in the URL rather than in component state: "show me
 * mine" is somewhere you went, so the back button and a pasted link should
 * both honour it.
 */
export function CrmSidebar({ meName, chapterName, counts, isAdmin }: Props) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const scope = params.get("scope") ?? "all";
  const onBoard = pathname === "/crm";

  // The drawer closes on the tap that navigates rather than in an effect
  // watching the path: a drawer that outlives the tap is a trap on a phone,
  // and doing it here means it shuts even when the link is the current page.
  const close = () => setOpen(false);

  const count = (key: string) =>
    key === "mine" ? counts.mine : key === "unclaimed" ? counts.unclaimed : counts.all;

  const nav = (
    <nav className="flex h-full flex-col gap-1 p-3">
      <Link
        href="/crm"
        onClick={close}
        className="mb-4 flex items-center gap-2.5 rounded-xl px-2 py-1.5"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bni text-[11px] font-bold text-white">
          BNI
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold leading-tight text-foreground">
            {chapterName}
          </span>
          <span className="block text-xs leading-tight text-muted">
            Visitor CRM
          </span>
        </span>
      </Link>

      <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-[0.07em] text-ink-muted">
        Pipeline
      </p>
      {SCOPES.map((item) => {
        const active = onBoard && scope === item.key;
        return (
          <Link
            key={item.key}
            href={item.key === "all" ? "/crm" : `/crm?scope=${item.key}`}
            onClick={close}
            aria-current={active ? "page" : undefined}
            className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              active
                ? "bg-bni text-white"
                : "text-foreground hover:bg-surface-muted"
            }`}
          >
            {item.label}
            <span
              className={`tabular-nums text-xs font-bold ${
                active ? "text-white/80" : "text-ink-muted"
              }`}
            >
              {count(item.key)}
            </span>
          </Link>
        );
      })}

      {counts.needsChasing > 0 ? (
        <p className="mt-2 rounded-xl bg-surface-muted px-3 py-2 text-xs leading-relaxed text-muted">
          <strong className="font-bold text-foreground">
            {counts.needsChasing}
          </strong>{" "}
          {counts.needsChasing === 1 ? "has" : "have"} been claimed over a week
          without an invite going out.
        </p>
      ) : null}

      <div className="mt-4">
        <AddVisitor full />
      </div>

      {counts.archived > 0 ? (
        <Link
          href="/crm/archive"
          onClick={close}
          aria-current={pathname === "/crm/archive" ? "page" : undefined}
          className={`mt-1 flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
            pathname === "/crm/archive"
              ? "bg-bni text-white"
              : "text-muted hover:bg-surface-muted hover:text-foreground"
          }`}
        >
          Archive
          <span
            className={`tabular-nums text-xs font-bold ${
              pathname === "/crm/archive" ? "text-white/80" : "text-ink-muted"
            }`}
          >
            {counts.archived}
          </span>
        </Link>
      ) : null}

      <p className="px-2 pb-1 pt-5 text-[11px] font-bold uppercase tracking-[0.07em] text-ink-muted">
        Inviting
      </p>
      <Link
        href="/crm/import"
        onClick={close}
        aria-current={pathname === "/crm/import" ? "page" : undefined}
        className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
          pathname === "/crm/import"
            ? "bg-bni text-white"
            : "text-foreground hover:bg-surface-muted"
        }`}
      >
        Import a spreadsheet
      </Link>
      <Link
        href="/crm/toolkit"
        onClick={close}
        aria-current={pathname === "/crm/toolkit" ? "page" : undefined}
        className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
          pathname === "/crm/toolkit"
            ? "bg-bni text-white"
            : "text-foreground hover:bg-surface-muted"
        }`}
      >
        Invite toolkit
      </Link>

      {isAdmin ? (
        <>
          <p className="px-2 pb-1 pt-5 text-[11px] font-bold uppercase tracking-[0.07em] text-ink-muted">
            Chapter
          </p>
          <Link
            href="/crm/reports"
            onClick={close}
            aria-current={pathname === "/crm/reports" ? "page" : undefined}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              pathname === "/crm/reports"
                ? "bg-bni text-white"
                : "text-foreground hover:bg-surface-muted"
            }`}
          >
            Reports
          </Link>
        </>
      ) : null}

      <div className="mt-auto space-y-2 pt-4">
        <Link
          href="https://www.bnidabbers.co.uk"
          onClick={close}
          className="block rounded-xl px-3 py-2 text-sm font-semibold text-muted transition hover:bg-surface-muted hover:text-foreground"
        >
          &larr; Back to the website
        </Link>
        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-white px-2.5 py-2">
          <UserButton />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold leading-tight text-foreground">
              {meName}
            </span>
            <span className="block text-[11px] leading-tight text-ink-muted">
              Signed in
            </span>
          </span>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {/* Phone: a bar with the drawer trigger, since 15rem of sidebar on a
          390px screen leaves nothing for the board. */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-white px-4 py-2.5 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open the CRM menu"
          className="flex size-9 items-center justify-center rounded-xl border border-border text-foreground"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              d="M2 4.5h14M2 9h14M2 13.5h14"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <span className="text-sm font-bold text-foreground">Visitor CRM</span>
        <span className="ml-auto text-xs font-semibold text-ink-muted">
          {counts.all} in the pipeline
        </span>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close the menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute inset-y-0 left-0 w-[16rem] max-w-[85vw] overflow-y-auto border-r border-border bg-surface">
            {nav}
          </div>
        </div>
      ) : null}

      <aside className="hidden h-full w-[15rem] shrink-0 overflow-y-auto border-r border-border bg-surface lg:block">
        {nav}
      </aside>
    </>
  );
}
