"use client";

import { useState, useTransition } from "react";
import type { ChapterSettings } from "@/db/schema";
import { refreshTyfcbFromBni, saveTyfcbSettings } from "@/actions/tyfcb";
import { DEFAULT_TYFCB_SOURCE_URL } from "@/lib/tyfcb";
import {
  formatTyfcbExact,
  formatTyfcbVerifiedMonth,
} from "@/lib/tyfcb";

type TyfcbSettingsPanelProps = {
  settings: ChapterSettings;
};

export function TyfcbSettingsPanel({ settings }: TyfcbSettingsPanelProps) {
  const [enabled, setEnabled] = useState(settings.tyfcbEnabled);
  const [sourceUrl, setSourceUrl] = useState(
    settings.tyfcbSourceUrl ?? DEFAULT_TYFCB_SOURCE_URL,
  );
  const [manualAmount, setManualAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const displayAmount = formatTyfcbExact(settings);
  const verified = formatTyfcbVerifiedMonth(settings);

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await saveTyfcbSettings({
        tyfcbEnabled: enabled,
        tyfcbSourceUrl: sourceUrl,
        tyfcbAmountManual: manualAmount || undefined,
      });
      if (!result.success) {
        setError(result.error ?? "Could not save");
        return;
      }
      setMessage("TYFCB settings saved.");
      setManualAmount("");
    });
  }

  function handleRefresh() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await refreshTyfcbFromBni({ force: true });
      if (!result.success) {
        setError(result.error ?? "Refresh failed");
        return;
      }
      if ("skipped" in result && result.skipped) {
        setMessage("Refresh skipped (no change needed).");
        return;
      }
      setMessage("TYFCB refreshed from BNI Connect.");
      window.location.reload();
    });
  }

  return (
    <section className="mt-10 rounded-xl border border-border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Chapter TYFCB (12-month results)</h2>
      <p className="mt-2 text-sm text-muted">
        Syncs from BNI Connect for display on the homepage and visit pages. Cron runs daily on
        Vercel (no-op unless a new calendar month).
      </p>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Current value</dt>
          <dd className="font-medium text-foreground">{displayAmount || "Not set"}</dd>
        </div>
        <div>
          <dt className="text-muted">Last verified</dt>
          <dd className="font-medium text-foreground">{verified || "Never"}</dd>
        </div>
      </dl>

      <form onSubmit={handleSave} className="mt-6 space-y-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          Show TYFCB on public pages
        </label>
        <div>
          <label className="text-sm font-medium text-foreground">BNI API URL</label>
          <input
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Manual override amount (optional)</label>
          <input
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            placeholder="5575912"
            value={manualAmount}
            onChange={(event) => setManualAmount(event.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-bni">{error}</p> : null}
        {message ? <p className="text-sm text-muted">{message}</p> : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-bni px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Save TYFCB settings
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleRefresh}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            Refresh now from BNI
          </button>
        </div>
      </form>
    </section>
  );
}
