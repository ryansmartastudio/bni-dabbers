import type { Metadata } from "next";
import Link from "next/link";
import { applyChapterTokensToPage } from "@/lib/chapter-tokens";
import { DatabaseSetupError } from "@/components/setup/database-error";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { loadWithDatabaseSetupFallback } from "@/lib/db-errors";
import { buildStaticPageMetadata } from "@/lib/marketing/static-metadata";
import { getPagePublicPath, listPublishedArticlePages } from "@/lib/pages";
import { getChapterSettings } from "@/lib/settings";

export const revalidate = 3600;

export const metadata: Metadata = buildStaticPageMetadata(
  "/insights",
  "Insights for Cheshire East business owners",
  "Practical articles on referrals, local networking and growing your business through BNI Dabbers.",
);

export default async function InsightsHubPage() {
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

  return (
    <MarketingShell>
      <div className="marketing-container py-12 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-bni">Insights</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
          Business networking insights
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Articles from {settings.chapterName} on referrals, visitor tips and growing locally in
          Cheshire East.
        </p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          {articles.map((article) => {
            const hydrated = applyChapterTokensToPage(article, settings);
            const href = getPagePublicPath(article);
            return (
              <li key={article.id}>
                <Link
                  href={href}
                  className="block rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:border-bni/30 hover:shadow-md"
                >
                  <h2 className="text-xl font-semibold text-foreground">{hydrated.title}</h2>
                  {hydrated.excerpt ? (
                    <p className="mt-2 text-sm text-muted">{hydrated.excerpt}</p>
                  ) : (
                    <p className="mt-2 line-clamp-3 text-sm text-muted">{hydrated.metaDescription}</p>
                  )}
                  <span className="mt-4 inline-block text-sm font-semibold text-bni">
                    Read article →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </MarketingShell>
  );
}
