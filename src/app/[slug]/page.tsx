import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingPageView } from "@/components/marketing/marketing-page-view";
import { DatabaseSetupError } from "@/components/setup/database-error";
import { applyChapterTokensToPage } from "@/lib/chapter-tokens";
import { loadWithDatabaseSetupFallback } from "@/lib/db-errors";
import { buildPageMetadata } from "@/lib/marketing/metadata";
import { getActiveMembers } from "@/lib/members";
import {
  getPagePublicPath,
  getPublishedPageBySlug,
  listPublishedLocationPages,
  listPublishedStandardPages,
  RESERVED_ROOT_SLUGS,
} from "@/lib/pages";
import { getChapterSettings } from "@/lib/settings";

export const revalidate = 3600;

type StandardPageProps = PageProps<"/[slug]">;

export const dynamicParams = true;

export async function generateStaticParams() {
  const { safeGenerateStaticParams } = await import("@/lib/build-time-db");
  return safeGenerateStaticParams(async () => {
    const pages = await listPublishedStandardPages();
    return pages
      .filter((page) => !RESERVED_ROOT_SLUGS.has(page.slug))
      .map((page) => ({ slug: page.slug }));
  });
}

export async function generateMetadata({
  params,
}: StandardPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED_ROOT_SLUGS.has(slug)) {
    return { title: "Page not found" };
  }

  const page = await getPublishedPageBySlug(slug);
  if (!page || page.kind !== "standard") {
    return { title: "Page not found" };
  }

  const settings = await getChapterSettings();
  const hydratedPage = applyChapterTokensToPage(page, settings);
  return buildPageMetadata(hydratedPage, getPagePublicPath(hydratedPage));
}

export default async function StandardMarketingPage({ params }: StandardPageProps) {
  const { slug } = await params;
  if (RESERVED_ROOT_SLUGS.has(slug)) {
    notFound();
  }

  const page = await getPublishedPageBySlug(slug);
  if (!page || page.kind !== "standard") {
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
  const conversionSlugs = new Set([
    "what-to-expect-as-a-visitor",
    "guest-day",
    "bni-visitor-faq",
    "is-bni-worth-it",
  ]);

  return (
    <MarketingPageView
      page={page}
      settings={settings}
      members={members}
      memberCount={members.length}
      locationPages={locationPages}
      showLocationsGrid={false}
      showTyfcbBanner={conversionSlugs.has(page.slug)}
    />
  );
}
