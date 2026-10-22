import type { Metadata } from "next";
import { MarketingPageView } from "@/components/marketing/marketing-page-view";
import { DatabaseSetupError } from "@/components/setup/database-error";
import { loadWithDatabaseSetupFallback } from "@/lib/db-errors";
import { applyChapterTokensToPage } from "@/lib/chapter-tokens";
import { buildFallbackHomePage } from "@/lib/marketing/fallback-home";
import { buildPageMetadata } from "@/lib/marketing/metadata";
import { getActiveMembers } from "@/lib/members";
import {
  getPublishedHomePage,
  listPublishedLocationPages,
} from "@/lib/pages";
import { getChapterSettings } from "@/lib/settings";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const [homePage, settings] = await Promise.all([
    getPublishedHomePage(),
    getChapterSettings(),
  ]);
  const page = applyChapterTokensToPage(
    homePage ?? buildFallbackHomePage(),
    settings,
  );
  return buildPageMetadata(page, "/");
}

export default async function HomePage() {
  const result = await loadWithDatabaseSetupFallback(async () => {
    const [settings, members, homePage, locationPages] = await Promise.all([
      getChapterSettings(),
      getActiveMembers(),
      getPublishedHomePage(),
      listPublishedLocationPages(),
    ]);

    return { settings, members, homePage, locationPages };
  });

  if (!result.ok) {
    return <DatabaseSetupError message={result.setupError} />;
  }

  const { settings, members, homePage, locationPages } = result.data;
  const page = homePage ?? buildFallbackHomePage();

  return (
    <MarketingPageView
      page={page}
      settings={settings}
      members={members}
      memberCount={members.length}
      locationPages={locationPages}
      showLocationsGrid
      showTyfcbBanner
    />
  );
}
