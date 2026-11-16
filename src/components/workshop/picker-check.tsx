"use client";

import { useState, useSyncExternalStore } from "react";

type ContactsApi = {
  select: (
    props: string[],
    options?: { multiple?: boolean },
  ) => Promise<Array<{ name?: string[]; tel?: string[]; email?: string[] }>>;
};

function subscribeNoop() {
  return () => {};
}

/** The same feature test the workshop itself uses, so the answer agrees. */
function hasContactsApi(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  return (
    "contacts" in navigator &&
    "ContactsManager" in window &&
    typeof (navigator as Navigator & { contacts?: ContactsApi }).contacts?.select ===
      "function"
  );
}

/**
 * "Did it work?" — the question the printed card cannot answer.
 *
 * Switching on a Safari feature flag gives no feedback at all, so without
 * this people arrive on the day not knowing whether they did it right, which
 * is exactly the moment there is no time to find out.
 */
export function PickerCheck() {
  const available = useSyncExternalStore(subscribeNoop, hasContactsApi, () => false);
  const [result, setResult] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function tryIt() {
    setResult(null);
    setFailed(false);
    const api = (navigator as Navigator & { contacts?: ContactsApi }).contacts;
    if (!api) {
      setFailed(true);
      return;
    }
    try {
      const picked = await api.select(["name"], { multiple: false });
      const first = picked[0];
      if (!first) {
        setResult("You closed it without picking anyone — but it opened, so you're set.");
        return;
      }
      setResult(
        `It works. You picked ${first.name?.[0] ?? "someone"} — nothing was saved or sent anywhere.`,
      );
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="mt-6">
      <div
        className={`rounded-2xl border-2 p-5 text-center ${
          available ? "border-[#1F7A3E] bg-[#EAF6EE]" : "border-bni bg-[#FDECEE]"
        }`}
      >
        <p
          className={`text-2xl font-bold ${available ? "text-[#1F7A3E]" : "text-[#A51A26]"}`}
        >
          {available ? "You're all set" : "Not switched on yet"}
        </p>
        <p className="mt-1 text-sm text-muted">
          {available
            ? "This phone can share a contact straight into the workshop."
            : "This phone can't open your contacts list yet. The steps below take about a minute."}
        </p>

        {available ? (
          <button
            type="button"
            onClick={tryIt}
            className="mt-4 w-full rounded-xl bg-[#1F7A3E] px-5 py-3.5 text-base font-bold text-white"
          >
            Try it now
          </button>
        ) : null}

        {result ? (
          <p className="mt-3 text-sm font-semibold text-[#1F7A3E]">{result}</p>
        ) : null}
        {failed ? (
          <p className="mt-3 text-sm font-semibold text-[#A51A26]">
            That didn&rsquo;t open. Check the steps below, then fully close Safari and
            come back.
          </p>
        ) : null}
      </div>

      <p className="mt-2 text-center text-xs text-ink-muted">
        Nothing on this page is saved or sent anywhere.
      </p>
    </div>
  );
}
