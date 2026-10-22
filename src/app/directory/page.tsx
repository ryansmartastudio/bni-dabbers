import { getActiveMembers } from "@/lib/members";
import { getChapterSettings } from "@/lib/settings";
import { DirectoryGrid } from "@/components/directory/directory-grid";
import { DirectoryHero } from "@/components/directory/directory-hero";
import { JsonLd } from "@/components/marketing/json-ld";
import { TyfcbBanner } from "@/components/marketing/tyfcb-banner";
import { buildItemListJsonLd } from "@/lib/marketing/structured-data";
import { getMemberDisplayName, getMemberProfilePath } from "@/lib/members";
import { absoluteUrl } from "@/lib/site-url";
import { DatabaseSetupError } from "@/components/setup/database-error";
import { loadWithDatabaseSetupFallback } from "@/lib/db-errors";
import type { Metadata } from "next";
import { buildStaticPageMetadata } from "@/lib/marketing/static-metadata";

export const revalidate = 3600;

export const metadata: Metadata = buildStaticPageMetadata(
  "/directory",
  "Member directory",
  "Browse active BNI Dabbers members in Cheshire East — companies, trade categories and public profiles.",
);

export default async function DirectoryPage() {
  const result = await loadWithDatabaseSetupFallback(async () => {
    const [members, settings] = await Promise.all([
      getActiveMembers(),
      getChapterSettings(),
    ]);
    return { members, settings };
  });

  if (!result.ok) {
    return <DatabaseSetupError message={result.setupError} />;
  }

  const { members, settings } = result.data;

  const itemListJsonLd = buildItemListJsonLd(
    `${settings.chapterName} members`,
    members
      .filter((member) => member.slug)
      .map((member) => ({
        name: getMemberDisplayName(member),
        url: absoluteUrl(getMemberProfilePath(member)),
      })),
  );

  return (
    <div className="directory-shell">
      <JsonLd data={itemListJsonLd} />
      <DirectoryHero settings={settings} memberCount={members.length} />
      <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <TyfcbBanner settings={settings} />
      </div>
      <DirectoryGrid members={members} />
    </div>
  );
}
