"use client";

import { useMemo, useState, useTransition } from "react";
import { sendWelcomeTo } from "@/actions/crm";
import type { WelcomeRecipient, WelcomeSendResult } from "@/lib/crm/welcome";

function when(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Who in the chapter knows the CRM exists, and who still needs telling.
 *
 * The send button is the only thing in here that reaches outside the app, so
 * it is deliberately slow to press: you pick people, the button counts them
 * back at you, and then it asks once more. Nobody should be able to email
 * thirty-six people by clicking the wrong thing.
 */
export function MemberAccessView({
  recipients,
}: {
  recipients: WelcomeRecipient[];
}) {
  const notTold = useMemo(
    () => recipients.filter((r) => !r.signedIn && !r.emailedAt),
    [recipients],
  );
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<WelcomeSendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const signedIn = recipients.filter((r) => r.signedIn).length;
  const emailed = recipients.filter((r) => r.emailedAt).length;

  function toggle(id: string) {
    setChosen((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setConfirming(false);
  }

  function selectAllNotTold() {
    setChosen(new Set(notTold.map((r) => r.id)));
    setConfirming(false);
  }

  function clear() {
    setChosen(new Set());
    setConfirming(false);
  }

  function send() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const outcome = await sendWelcomeTo([...chosen]);
      setConfirming(false);
      if (!outcome.ok) {
        setError(outcome.error);
        return;
      }
      setResult(outcome.data);
      setChosen(new Set());
    });
  }

  const count = chosen.size;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-5">
          <h1 className="text-xl font-bold text-foreground">Member access</h1>
          <p className="mt-0.5 text-sm text-muted">
            Who can get into the pipeline, and who still needs telling. Admins
            only.
          </p>
        </header>

        <div className="grid grid-cols-3 gap-2">
          <Figure value={recipients.length} label="active members" />
          <Figure value={signedIn} label="have signed in" />
          <Figure value={emailed} label="have been emailed" />
        </div>

        {result ? (
          <section className="mt-4 rounded-2xl border border-border bg-surface-muted p-4">
            <p className="text-sm font-bold text-foreground">
              {result.sent} {result.sent === 1 ? "email" : "emails"} sent.
            </p>
            {result.failures.length > 0 ? (
              <div className="mt-2">
                <p className="text-xs font-bold text-bni">
                  {result.failures.length} did not go:
                </p>
                <ul className="mt-1 space-y-0.5">
                  {result.failures.map((failure) => (
                    <li key={failure.email} className="text-xs text-muted">
                      {failure.name} &lt;{failure.email}&gt; &mdash;{" "}
                      {failure.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {result.skipped.length > 0 ? (
              <div className="mt-2">
                <p className="text-xs font-bold text-foreground">
                  {result.skipped.length} skipped:
                </p>
                <ul className="mt-1 space-y-0.5">
                  {result.skipped.map((skip) => (
                    <li key={skip.name} className="text-xs text-muted">
                      {skip.name} &mdash; {skip.reason}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-2xl border border-border bg-surface-muted p-3 text-sm font-semibold text-bni"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={selectAllNotTold}
            disabled={notTold.length === 0}
            className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground disabled:opacity-50"
          >
            Select the {notTold.length} not told yet
          </button>
          {count > 0 ? (
            <button
              type="button"
              onClick={clear}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-muted hover:text-foreground"
            >
              Clear
            </button>
          ) : null}
        </div>

        {count > 0 ? (
          <div className="mt-3 rounded-2xl border border-bni bg-white p-4">
            {confirming ? (
              <>
                <p className="text-sm font-bold text-foreground">
                  Send the welcome email to {count}{" "}
                  {count === 1 ? "person" : "people"}?
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  It goes out now, from the chapter, and cannot be recalled.
                  Each one is told to sign in with the address on their own
                  member record.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={send}
                    className="rounded-xl bg-bni px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {pending ? "Sending" : `Yes, send ${count}`}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setConfirming(false)}
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
                className="w-full rounded-xl bg-bni px-4 py-2.5 text-sm font-bold text-white"
              >
                Send the welcome email to {count}{" "}
                {count === 1 ? "person" : "people"}
              </button>
            )}
          </div>
        ) : null}

        <ul className="mt-4 space-y-1.5">
          {recipients.map((person) => {
            const picked = chosen.has(person.id);
            return (
              <li key={person.id}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                    picked
                      ? "border-bni bg-surface-muted"
                      : "border-border bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={picked}
                    onChange={() => toggle(person.id)}
                    className="size-4 shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-foreground">
                      {person.name}
                      <span className="ml-2 font-semibold text-ink-muted">
                        {person.seat}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {person.email}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-[11px] font-semibold">
                    {person.signedIn ? (
                      <span className="text-foreground">Signed in</span>
                    ) : person.emailedAt ? (
                      <span className="text-ink-muted">
                        Emailed {when(person.emailedAt)}
                      </span>
                    ) : (
                      <span className="text-bni">Not told yet</span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2">
      <p className="text-xl font-bold tabular-nums leading-none text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] font-semibold text-muted">{label}</p>
    </div>
  );
}
