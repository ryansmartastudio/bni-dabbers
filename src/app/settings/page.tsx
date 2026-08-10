import { requireAdmin } from "@/lib/auth";
import { getChapterSettings, getCharityLinks } from "@/lib/settings";
import {
  listAdminUsers,
  listPendingAdminInvites,
} from "@/lib/clerk-admins";
import { SettingsForm } from "@/components/settings/settings-form";
import { AdminAccessPanel } from "@/components/settings/admin-access-panel";
import { DatabaseSetupError } from "@/components/setup/database-error";
import {
  getDatabaseSetupMessage,
  isDatabaseSetupError,
} from "@/lib/db-errors";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { userId } = await requireAdmin();

  let settings;
  let charityLinks;
  let admins;
  let pendingInvites;

  try {
    [settings, charityLinks, admins, pendingInvites] = await Promise.all([
      getChapterSettings(),
      getCharityLinks(),
      listAdminUsers(),
      listPendingAdminInvites(),
    ]);
  } catch (error) {
    if (isDatabaseSetupError(error)) {
      return (
        <DatabaseSetupError message={getDatabaseSetupMessage(error)} />
      );
    }

    throw error;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Chapter settings</h1>
        <p className="mt-2 text-sm text-muted">
          Configure the meeting sheet booklet, charity block and chapter details.
          Changes apply the next time you generate a PDF.
        </p>
      </div>
      <div className="space-y-6">
        <AdminAccessPanel
          admins={admins}
          pendingInvites={pendingInvites}
          currentUserId={userId}
        />
        <SettingsForm settings={settings} charityLinks={charityLinks} />
      </div>
    </div>
  );
}
