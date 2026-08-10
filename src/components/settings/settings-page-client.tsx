"use client";

import { useState } from "react";
import type { ChapterSettings, CharityLink } from "@/db/schema";
import { AdminAccessPanel } from "@/components/settings/admin-access-panel";
import { SettingsForm } from "@/components/settings/settings-form";
import {
  SettingsTabs,
  type SettingsTabId,
} from "@/components/settings/settings-tabs";
import type {
  AdminUserSummary,
  PendingInviteSummary,
} from "@/lib/clerk-admins";

type SettingsPageClientProps = {
  settings: ChapterSettings;
  charityLinks: CharityLink[];
  admins: AdminUserSummary[];
  pendingInvites: PendingInviteSummary[];
  currentUserId: string;
};

export function SettingsPageClient({
  settings,
  charityLinks,
  admins,
  pendingInvites,
  currentUserId,
}: SettingsPageClientProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>("chapter");

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <SettingsTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="p-5 sm:p-6">
        {activeTab === "admins" ? (
          <AdminAccessPanel
            admins={admins}
            pendingInvites={pendingInvites}
            currentUserId={currentUserId}
          />
        ) : (
          <SettingsForm
            settings={settings}
            charityLinks={charityLinks}
            activeTab={activeTab}
          />
        )}
      </div>
    </div>
  );
}
