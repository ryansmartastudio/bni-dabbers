"use client";

import { useState, useSyncExternalStore } from "react";
import {
  getContactsApi,
  hasContactsApi,
  isAndroid,
  isChrome,
  isSamsungInternet,
  subscribeNoop,
} from "@/lib/workshop/contacts-api";

/**
 * "Did it work?" — the question the printed card cannot answer.
 *
 * Switching on a Safari feature flag gives no feedback at all, so without
 * this people arrive on the day not knowing whether they did it right, which
 * is exactly the moment there is no time to find out. It runs the same test
 * the workshop does, from the same module, so the two can never disagree.
 */
export function PickerCheck() {
  const available = useSyncExternalStore(subscribeNoop, hasContactsApi, () => false);
  const android = useSyncExternalStore(subscribeNoop, isAndroid, () => false);
  const samsung = useSyncExternalStore(subscribeNoop, isSamsungInternet, () => false);
  const chrome = useSyncExternalStore(subscribeNoop, isChrome, () => false);
  const [result, setResult] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [details, setDetails] = useState(false);

  async function tryIt() {
    setResult(null);
    setFailed(null);
    const api = getContactsApi();
    if (!api) {
      setFailed("This browser has no contact picker at all.");
      return;
    }
    for (const props of [["name", "tel"], ["name"]]) {
      try {
        const picked = await api.select(props, { multiple: false });
        const first = picked[0];
        setResult(
          first
            ? `It works. You picked ${first.name?.[0] ?? "someone"} — nothing was saved or sent anywhere.`
            : "You closed it without picking anyone — but it opened, so you're set.",
        );
        return;
      } catch (error) {
        setFailed(String(error));
      }
    }
  }

  return (
    <div className="mt-6">
      <div
        className={`rounded-2xl border-2 p-5 text-center ${
          available ? "border-[#1F7A3E] bg-[#EAF6EE]" : "border-bni bg-[#FDECEE]"
        }`}
      >
        <p className={`text-2xl font-bold ${available ? "text-[#1F7A3E]" : "text-[#A51A26]"}`}>
          {available ? "You're all set" : "Not switched on yet"}
        </p>
        <p className="mt-1 text-sm text-muted">
          {available
            ? "This phone can share a contact straight into the workshop."
            : android
              ? chrome
                ? "This phone can't open your contacts list. You can still type names in on the day."
                : `${samsung ? "Samsung Internet" : "This browser"} can't open your contacts. Try opening this page in Chrome.`
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

        {result ? <p className="mt-3 text-sm font-semibold text-[#1F7A3E]">{result}</p> : null}
        {failed ? (
          <p className="mt-3 text-sm font-semibold text-[#A51A26]">
            That didn&rsquo;t open. Check the steps below, then fully close your browser and
            come back.
          </p>
        ) : null}
      </div>

      <p className="mt-2 text-center text-xs text-ink-muted">
        Nothing on this page is saved or sent anywhere.{" "}
        <button
          type="button"
          onClick={() => setDetails((v) => !v)}
          className="underline"
        >
          {details ? "Hide details" : "Show details"}
        </button>
      </p>

      {/* Something to screenshot when a phone behaves differently to the rest. */}
      {details ? (
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-surface-muted px-3 py-2 font-mono text-[10px] leading-relaxed text-foreground">
          {[
            `picker: ${available ? "yes" : "no"}`,
            `ContactsManager: ${typeof window !== "undefined" && "ContactsManager" in window ? "yes" : "no"}`,
            `android: ${android} · samsung: ${samsung} · chrome: ${chrome}`,
            failed ? `last error: ${failed}` : null,
            `ua: ${typeof navigator === "undefined" ? "—" : navigator.userAgent}`,
          ]
            .filter(Boolean)
            .join("\n")}
        </pre>
      ) : null}
    </div>
  );
}

/**
 * The iPhone steps are the bulk of this page and don't apply on Android, so
 * say so before someone works through a menu their phone doesn't have.
 */
export function AndroidNote() {
  const android = useSyncExternalStore(subscribeNoop, isAndroid, () => false);
  const samsung = useSyncExternalStore(subscribeNoop, isSamsungInternet, () => false);
  const chrome = useSyncExternalStore(subscribeNoop, isChrome, () => false);
  if (!android) return null;

  return (
    <div className="mt-8 rounded-2xl border-2 border-foreground bg-white p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
        You&rsquo;re on Android
      </p>
      <p className="mt-1.5 text-[15px] font-semibold leading-relaxed text-foreground">
        {chrome
          ? "There's nothing to switch on — Chrome handles this already. The iPhone steps below don't apply to you."
          : `${samsung ? "Samsung Internet" : "This browser"} has no one-tap contact picker, and no setting adds one. On the day you can still tap "Import a contact card" and choose Contacts — or open the workshop in Chrome, where it is one tap.`}
      </p>
      <p className="mt-2 text-sm text-muted">
        {chrome
          ? "If the check above says otherwise, screenshot the details and send them to Ryan."
          : "Typing names in works on any phone, and most people do that anyway."}
      </p>
    </div>
  );
}
