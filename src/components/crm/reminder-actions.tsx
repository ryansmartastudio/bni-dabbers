"use client";

import { useState, useTransition } from "react";
import { markInvited, releaseToPool, undoInvited } from "@/actions/crm-reminders";

type Props = {
  token: string;
  kind: "undo" | "release" | "invited";
};

const COPY = {
  undo: {
    label: "That wasn't right — undo it",
    done: "Put back. They're still yours to invite.",
    className:
      "rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground",
  },
  invited: {
    label: "Actually, I've just sent it",
    done: "Marked as invited. Nice one.",
    className: "rounded-xl bg-bni px-4 py-2.5 text-sm font-bold text-white",
  },
  release: {
    label: "Hand them back to the chapter",
    done: "Done. Anyone can pick them up now.",
    className: "rounded-xl bg-bni px-4 py-2.5 text-sm font-bold text-white",
  },
} as const;

/**
 * Undo on the "yes" page and Release on the "not yet" page.
 *
 * Undo is what makes a one-tap link from an email safe: a mail client that
 * follows the link on the member's behalf is a nuisance they can reverse,
 * rather than a wrong record nobody notices.
 */
export function ReminderAction({ token, kind }: Props) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const copy = COPY[kind];

  if (done) {
    return <p className="text-sm font-semibold text-foreground">{copy.done}</p>;
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const act =
              kind === "undo"
                ? undoInvited
                : kind === "invited"
                  ? markInvited
                  : releaseToPool;
            const result = await act(token);
            if (result.ok) setDone(true);
            else setError(result.error);
          })
        }
        className={`${copy.className} disabled:opacity-60`}
      >
        {copy.label}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm font-semibold text-bni">
          {error}
        </p>
      ) : null}
    </div>
  );
}
