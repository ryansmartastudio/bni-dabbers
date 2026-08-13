"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  bulkSendMemberInvitesAction,
  type BulkInviteMemberResult,
} from "@/actions/member-access";
import { Button } from "@/components/ui/button";
import { getMemberDisplayName } from "@/lib/members";
import type { Member } from "@/db/schema";

type BulkInviteMembersProps = {
  members: Member[];
};

type InvitePhase = "select" | "results";

export function BulkInviteMembers({ members }: BulkInviteMembersProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<InvitePhase>("select");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ sent: number; failed: number } | null>(
    null,
  );
  const [results, setResults] = useState<BulkInviteMemberResult[]>([]);
  const [isPending, startTransition] = useTransition();

  const inviteableMembers = useMemo(
    () =>
      members.filter(
        (member) => member.status === "active" && !member.clerkUserId,
      ),
    [members],
  );

  const allSelected =
    inviteableMembers.length > 0 &&
    inviteableMembers.every((member) => selectedIds.has(member.id));

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        handleClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, isPending]);

  function handleOpen() {
    setPhase("select");
    setSelectedIds(new Set(inviteableMembers.map((member) => member.id)));
    setError(null);
    setSummary(null);
    setResults([]);
    setOpen(true);
  }

  function handleClose() {
    if (isPending) return;
    setOpen(false);
    router.refresh();
  }

  function toggleMember(memberId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds(new Set(inviteableMembers.map((member) => member.id)));
  }

  function handleSendInvites() {
    if (selectedIds.size === 0) {
      setError("Select at least one member.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const response = await bulkSendMemberInvitesAction([...selectedIds]);

      if (!response.success) {
        setError(response.error);
        return;
      }

      setResults(response.results ?? []);
      setSummary({ sent: response.sent, failed: response.failed });
      setPhase("results");
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={handleOpen}
        disabled={inviteableMembers.length === 0}
      >
        Invite members
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
          onClick={handleClose}
          role="presentation"
        >
          <div
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-xl bg-white shadow-2xl sm:rounded-xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-invite-title"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-5">
              <div>
                <h2
                  id="bulk-invite-title"
                  className="text-base font-semibold text-foreground"
                >
                  Invite members to edit their profiles
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Each selected member receives their own invite email with a
                  link to create a password and manage their directory profile.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="rounded-md px-2 py-1 text-sm text-muted transition hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
                aria-label="Close"
              >
                Close
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              {phase === "select" ? (
                inviteableMembers.length === 0 ? (
                  <p className="text-sm text-muted">
                    Every active member already has profile access.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted/40 px-3 py-2.5 text-sm">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="size-4 rounded border-border text-bni focus:ring-bni"
                      />
                      <span className="font-medium text-foreground">
                        Select all ({inviteableMembers.length})
                      </span>
                    </label>

                    <ul className="divide-y divide-border rounded-xl border border-border">
                      {inviteableMembers.map((member) => {
                        const checked = selectedIds.has(member.id);
                        return (
                          <li key={member.id}>
                            <label className="flex cursor-pointer items-start gap-3 px-4 py-3 text-sm transition hover:bg-surface-muted/40">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleMember(member.id)}
                                className="mt-0.5 size-4 rounded border-border text-bni focus:ring-bni"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block font-medium text-foreground">
                                  {getMemberDisplayName(member)}
                                </span>
                                <span className="mt-0.5 block text-muted">
                                  {member.company}
                                </span>
                                <span className="mt-0.5 block text-muted">
                                  {member.email}
                                </span>
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-surface-muted/40 px-4 py-3 text-sm">
                    <p className="font-medium text-foreground">
                      {summary?.sent ?? 0} invite
                      {(summary?.sent ?? 0) === 1 ? "" : "s"} sent
                      {(summary?.failed ?? 0) > 0
                        ? ` · ${summary?.failed} failed`
                        : null}
                    </p>
                    <p className="mt-1 text-muted">
                      Invites are sent individually to each member&apos;s email
                      address.
                    </p>
                  </div>

                  <ul className="divide-y divide-border rounded-xl border border-border">
                    {(results ?? []).map((result) => (
                      <li
                        key={result.memberId}
                        className="px-4 py-3 text-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-foreground">
                              {result.name}
                            </p>
                            <p className="text-muted">{result.email}</p>
                          </div>
                          <span
                            className={
                              result.success
                                ? "font-medium text-emerald-700"
                                : "font-medium text-bni"
                            }
                          >
                            {result.success ? "Sent" : "Failed"}
                          </span>
                        </div>
                        {result.error ? (
                          <p className="mt-1 text-bni">{result.error}</p>
                        ) : null}
                        {result.success && result.emailSent === false ? (
                          <p className="mt-1 text-bni">
                            Invite created but email failed
                            {result.emailError ? `: ${result.emailError}` : "."}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {error ? (
                <p className="mt-4 rounded-md border border-bni/20 bg-red-50 px-4 py-3 text-sm text-bni">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-border px-4 py-4 sm:flex-row sm:justify-end sm:px-5">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isPending}
              >
                {phase === "results" ? "Done" : "Cancel"}
              </Button>
              {phase === "select" ? (
                <Button
                  type="button"
                  onClick={handleSendInvites}
                  disabled={isPending || selectedIds.size === 0}
                >
                  {isPending
                    ? "Sending invites..."
                    : `Send ${selectedIds.size} invite${selectedIds.size === 1 ? "" : "s"}`}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
