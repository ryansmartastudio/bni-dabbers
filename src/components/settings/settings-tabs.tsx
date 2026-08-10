"use client";

import { cn } from "@/lib/utils";

export const SETTINGS_TABS = [
  { id: "chapter", label: "Chapter & venue" },
  { id: "cover", label: "Cover page" },
  { id: "charity", label: "Charity" },
  { id: "weekly", label: "Weekly sheet" },
  { id: "admins", label: "Admins" },
] as const;

export type SettingsTabId = (typeof SETTINGS_TABS)[number]["id"];

type SettingsTabsProps = {
  activeTab: SettingsTabId;
  onChange: (tab: SettingsTabId) => void;
};

export function SettingsTabs({ activeTab, onChange }: SettingsTabsProps) {
  return (
    <div className="overflow-x-auto border-b border-border">
      <div className="flex min-w-max gap-1 px-1" role="tablist" aria-label="Settings sections">
        {SETTINGS_TABS.map((tab) => {
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
