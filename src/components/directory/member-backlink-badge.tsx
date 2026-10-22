"use client";

import { useState } from "react";
import type { Member } from "@/db/schema";
import { getMemberDisplayName, getMemberProfilePath } from "@/lib/members";
import { absoluteUrl } from "@/lib/site-url";

type MemberBacklinkBadgeProps = {
  member: Member;
  chapterName?: string;
};

export function MemberBacklinkBadge({
  member,
  chapterName = "BNI Dabbers",
}: MemberBacklinkBadgeProps) {
  const [copied, setCopied] = useState(false);
  const profileUrl = absoluteUrl(getMemberProfilePath(member));
  const name = getMemberDisplayName(member);

  const html = `<a href="${profileUrl}" title="${name} — ${chapterName} member">${name} is a member of ${chapterName}</a>`;

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-10 rounded-xl border border-border bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
        Member badge
      </p>
      <p className="mt-2 text-sm text-muted">
        Add this link to your website to show you are a {chapterName} member and help visitors
        find your profile.
      </p>
      <pre className="mt-4 overflow-x-auto rounded-lg bg-surface-muted p-3 text-xs text-foreground">
        {html}
      </pre>
      <button
        type="button"
        onClick={copySnippet}
        className="mt-4 inline-flex rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground transition hover:border-bni/40 hover:text-bni"
      >
        {copied ? "Copied" : "Copy HTML snippet"}
      </button>
    </div>
  );
}
