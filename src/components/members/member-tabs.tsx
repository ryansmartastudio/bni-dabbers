"use client";

import { cn } from "@/lib/utils";

export const MEMBER_TABS = [
  { id: "details", label: "Details" },
  { id: "profile", label: "Public profile" },
  { id: "access", label: "Profile access" },
] as const;

export type MemberTabId = (typeof MEMBER_TABS)[number]["id"];

export const MY_PROFILE_TABS = [
  { id: "contact", label: "Contact" },
  { id: "profile", label: "Public profile" },
  { id: "visibility", label: "Visibility" },
] as const;

export type MyProfileTabId = (typeof MY_PROFILE_TABS)[number]["id"];

type SectionTabsProps<T extends string> = {
  activeTab: T;
  onChange: (tab: T) => void;
  tabs: readonly { id: T; label: string }[];
  ariaLabel: string;
};

export function SectionTabs<T extends string>({
  activeTab,
  onChange,
  tabs,
  ariaLabel,
}: SectionTabsProps<T>) {
  return (
    <div className="overflow-x-auto border-b border-border">
      <div
        className="flex min-w-max gap-1 px-1"
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => {
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

type MemberTabsProps = {
  activeTab: MemberTabId;
  onChange: (tab: MemberTabId) => void;
  tabs?: readonly { id: MemberTabId; label: string }[];
};

export function MemberTabs({
  activeTab,
  onChange,
  tabs = MEMBER_TABS,
}: MemberTabsProps) {
  return (
    <SectionTabs
      activeTab={activeTab}
      onChange={onChange}
      tabs={tabs}
      ariaLabel="Member sections"
    />
  );
}

type MyProfileTabsProps = {
  activeTab: MyProfileTabId;
  onChange: (tab: MyProfileTabId) => void;
};

export function MyProfileTabs({ activeTab, onChange }: MyProfileTabsProps) {
  return (
    <SectionTabs
      activeTab={activeTab}
      onChange={onChange}
      tabs={MY_PROFILE_TABS}
      ariaLabel="Profile sections"
    />
  );
}
