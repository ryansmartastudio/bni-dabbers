import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/marketing/article-view";
import { DatabaseSetupError } from "@/components/setup/database-error";
import { applyChapterTokensToPage } from "@/lib/chapter-tokens";
import { loadWithDatabaseSetupFallback } from "@/lib/db-errors";
import { buildPageMetadata } from "@/lib/marketing/metadata";
import {
  getPagePublicPath,
  getPublishedPageBySlug,
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
    const [settings, articles] = await Promise.all([
      getChapterSettings(),
      listPublishedArticlePages(),
    ]);
    return { settings, articles };
  });

  if (!result.ok) {
    return <DatabaseSetupError message={result.setupError} />;
  }

  const { settings, articles } = result.data;

  return <ArticleView page={page} settings={settings} relatedArticles={articles} />;
}
