import { getActiveMembers } from "@/lib/members";
import { getChapterSettings } from "@/lib/settings";
import { DirectoryGrid } from "@/components/directory/directory-grid";
import { DirectoryHero } from "@/components/directory/directory-hero";
import { DatabaseSetupError } from "@/components/setup/database-error";
import {
  getDatabaseSetupMessage,
  isDatabaseSetupError,
} from "@/lib/db-errors";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let members;
  let settings;

  try {
    [members, settings] = await Promise.all([
      getActiveMembers(),
      getChapterSettings(),
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
    <div className="directory-shell">
      <DirectoryHero settings={settings} memberCount={members.length} />
      <DirectoryGrid members={members} />
    </div>
  );
}
