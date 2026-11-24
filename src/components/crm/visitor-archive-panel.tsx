"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { archiveForChapter, deleteForever, restoreToChapter } from "@/actions/crm";

type Props = {
  visitorId: string;
  visitorName: string;
  archivedAt: string | null;
  isAdmin: boolean;
};

/**
 * Taking somebody out of the pipeline.
 *
 * Two different things sit here on purpose, and they are not given equal
 * weight. Archiving is reversible, open to any member and one click. Deleting
 * destroys the timeline with the person, so it is admin-only, needs the name
 * typed back, and is only reachable once they are already archived -- nobody
 * should be able to go from a live board to gone in one gesture.
 */
export function VisitorArchivePanel({
  visitorId,
  visitorName,
  archivedAt,
  isAdmin,
}: Props) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "That didn't work.");
    });
  }

  if (!archivedAt) {
    return (
      <section className="rounded-2xl border border-border bg-white p-4">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
          Archive
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Takes them off the board and out of the reminders. Nothing is lost,
          and anyone can put them back.
        </p>
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Why? Optional"
          aria-label="Why are you archiving them? Optional"
          className="mt-2 w-full rounded-xl border-[1.5px] border-[#BDBDC1] bg-white px-3 py-2 text-base outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/25"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => archiveForChapter(visitorId, reason))}
          className="mt-2 w-full rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground disabled:opacity-60"
        >
          Archive {visitorName.split(" ")[0]}
        </button>
        {error ? (
          <p role="alert" className="mt-2 text-xs font-semibold text-bni">
            {error}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-surface-muted p-4">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
        Archived
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Off the board since{" "}
        {new Date(archivedAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        . The history below is kept.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => restoreToChapter(visitorId))}
        className="mt-2 w-full rounded-xl bg-bni px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        Put them back in the pipeline
      </button>

      {isAdmin ? (
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted">
            Delete permanently
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Removes {visitorName} and every note, reminder and timeline entry
            about them. This cannot be undone, and it is the only way to honour
            somebody asking to be taken off the system.
          </p>
          {confirming ? (
            <>
              <label className="mt-2 block text-xs font-semibold text-foreground">
                Type <strong>{visitorName}</strong> to confirm
                <input
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                  autoComplete="off"
                  className="mt-1 w-full rounded-xl border-[1.5px] border-bni bg-white px-3 py-2 text-base font-normal outline-none"
                />
              </label>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={pending || typed.trim() !== visitorName.trim()}
                  onClick={() =>
                    run(async () => {
                      const result = await deleteForever(visitorId);
                      // The page this is on no longer exists, so leaving is
                      // part of succeeding rather than something to do after.
                      if (result.ok) router.push("/crm/archive");
                      return result;
                    })
                  }
                  className="flex-1 rounded-xl bg-bni px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                >
                  Delete for good
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setConfirming(false);
                    setTyped("");
                  }}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="mt-2 w-full rounded-xl border border-bni px-4 py-2.5 text-sm font-bold text-bni"
            >
              Delete permanently
            </button>
          )}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-2 text-xs font-semibold text-bni">
          {error}
        </p>
      ) : null}
    </section>
  );
}
