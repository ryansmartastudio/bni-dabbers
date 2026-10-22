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
  listPublishedArticlePages,
} from "@/lib/pages";
import { getChapterSettings } from "@/lib/settings";

export const revalidate = 3600;

type ArticlePageProps = PageProps<"/insights/[slug]">;

export const dynamicParams = true;

export async function generateStaticParams() {
  const { safeGenerateStaticParams } = await import("@/lib/build-time-db");
  return safeGenerateStaticParams(async () => {
    const articles = await listPublishedArticlePages();
    return articles.map((page) => ({ slug: page.slug }));
  });
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);
  if (!page || page.kind !== "article") {
    return { title: "Page not found" };
  }

  const settings = await getChapterSettings();
  const hydratedPage = applyChapterTokensToPage(page, settings);
  return buildPageMetadata(hydratedPage, getPagePublicPath(hydratedPage));
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);
  if (!page || page.kind !== "article") {
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

  return (
    <MarketingPageView
      page={page}
      settings={settings}
      members={members}
      memberCount={members.length}
      locationPages={locationPages}
      showMemberPreview={false}
      showLocationsGrid={false}
    />
  );
}
