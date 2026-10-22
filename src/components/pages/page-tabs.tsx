"use client";

import { cn } from "@/lib/utils";

export const PAGE_TABS = [
  { id: "seo", label: "SEO" },
  { id: "hero", label: "Hero" },
  { id: "sections", label: "Sections" },
  { id: "faq", label: "FAQ" },
  { id: "cta", label: "CTA" },
] as const;

export type PageTabId = (typeof PAGE_TABS)[number]["id"];

type PageTabsProps = {
  activeTab: PageTabId;
  onChange: (tab: PageTabId) => void;
};

export function PageTabs({ activeTab, onChange }: PageTabsProps) {
  return (
    <div className="overflow-x-auto border-b border-border">
      <div className="flex min-w-max gap-1 px-1" role="tablist" aria-label="Page sections">
        {PAGE_TABS.map((tab) => {
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
