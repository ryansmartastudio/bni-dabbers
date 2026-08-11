"use client";

import { cn } from "@/lib/utils";

export const MEMBER_TABS = [
  { id: "details", label: "Details" },
  { id: "profile", label: "Public profile" },
] as const;

export type MemberTabId = (typeof MEMBER_TABS)[number]["id"];

type MemberTabsProps = {
  activeTab: MemberTabId;
  onChange: (tab: MemberTabId) => void;
};

export function MemberTabs({ activeTab, onChange }: MemberTabsProps) {
  return (
    <div className="overflow-x-auto border-b border-border">
      <div
        className="flex min-w-max gap-1 px-1"
        role="tablist"
        aria-label="Member sections"
      >
        {MEMBER_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                "rounded-t-md px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "border border-b-0 border-border bg-white text-foreground"
                  : "text-muted hover:bg-surface-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
