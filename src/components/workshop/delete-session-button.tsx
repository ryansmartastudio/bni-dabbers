"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteWorkshopSession } from "@/actions/workshop-admin";

/**
 * Two presses, never one.
 *
 * The confirmation names what goes and says it cannot be undone, because the
 * only thing standing between a mis-tap and a chapter night's worth of names
 * is this button.
 */
export function DeleteSessionButton({
  secret,
  sessionId,
  contacts,
  when,
  isCurrent,
}: {
  secret: string;
  sessionId: string;
  contacts: number;
  when: string;
  /** The run the board and the phones are still pointed at. */
  isCurrent: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
        className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-semibold text-muted transition hover:border-[#A51A26] hover:text-[#A51A26]"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2 rounded-lg border-2 border-[#A51A26] bg-[#FDECEE] px-3 py-2">
      <span className="text-xs font-semibold text-[#A51A26]">
        Delete {when} and its {contacts} {contacts === 1 ? "name" : "names"}? This
        can&rsquo;t be undone.
        {isCurrent
          ? " The board is still on this one, so it starts a fresh session and goes back to the holding screen."
          : ""}
      </span>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await deleteWorkshopSession(secret, sessionId);
            if (!result.ok) {
              setError(result.error ?? "That didn't work.");
              setConfirming(false);
              return;
            }
            router.refresh();
          })
        }
        className="rounded-md bg-[#A51A26] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setConfirming(false)}
        className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground"
      >
        Cancel
      </button>
      {error ? <span className="text-xs font-semibold text-[#A51A26]">{error}</span> : null}
    </span>
  );
}
