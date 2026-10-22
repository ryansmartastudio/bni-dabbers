import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingPageView } from "@/components/marketing/marketing-page-view";
import { DatabaseSetupError } from "@/components/setup/database-error";
import { loadWithDatabaseSetupFallback } from "@/lib/db-errors";
import { applyChapterTokensToPage } from "@/lib/chapter-tokens";
import { buildPageMetadata } from "@/lib/marketing/metadata";
import { getActiveMembers } from "@/lib/members";
import {
  getPagePublicPath,
  getPublishedPageBySlug,
  listPublishedLocationPages,
} from "@/lib/pages";
import { getChapterSettings } from "@/lib/settings";

export const revalidate = 3600;

export const dynamicParams = true;

export async function generateStaticParams() {
  const { safeGenerateStaticParams } = await import("@/lib/build-time-db");
  const { listPublishedLocationPages } = await import("@/lib/pages");
  return safeGenerateStaticParams(async () => {
    const pages = await listPublishedLocationPages();
    return pages.map((page) => ({ slug: page.slug }));
  });
}

type LocationPageProps = PageProps<"/networking-groups/[slug]">;

export async function generateMetadata({
  params,
}: LocationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);

  if (!page || page.kind !== "location") {
    return { title: "Page not found" };
  }

  const settings = await getChapterSettings();
  const hydratedPage = applyChapterTokensToPage(page, settings);
  return buildPageMetadata(hydratedPage, getPagePublicPath(hydratedPage));
}

export default async function LocationLandingPage({ params }: LocationPageProps) {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);

  if (!page || page.kind !== "location") {
    notFound();
  }

  const result = await loadWithDatabaseSetupFallback(async () => {
    const [settings, members, locationPages] = await Promise.all([
      getChapterSettings(),
      getActiveMembers(),
      listPublishedLocationPages(),
    ]);

    return { settings, members, locationPages };
  });

  if (!result.ok) {
    return <DatabaseSetupError message={result.setupError} />;
  }

  const { settings, members, locationPages } = result.data;
  const relatedLocations = locationPages.filter((item) => item.slug !== page.slug);

  return (
    <MarketingPageView
      page={page}
      settings={settings}
      members={members}
      memberCount={members.length}
      relatedLocations={relatedLocations}
      showTyfcbBanner
    />
  );
}
