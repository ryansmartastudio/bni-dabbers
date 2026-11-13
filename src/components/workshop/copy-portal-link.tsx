"use client";

import { useState } from "react";

/**
 * The link members get, not the admin one.
 *
 * Copied as an absolute URL because it is going into the chapter's WhatsApp
 * group: a relative path pasted into a chat is not a link at all.
 */
export function CopyPortalLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        const url = `${window.location.origin}${path}`;
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard blocked — show it so they can copy it by hand.
          window.prompt("Copy the portal link:", url);
        }
      }}
      className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-semibold text-muted transition hover:text-foreground"
    >
      {copied ? "Copied ✓" : "Copy link"}
    </button>
  );
}
