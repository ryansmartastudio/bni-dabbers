import type { Metadata } from "next";
import Link from "next/link";
import { applyChapterTokensToPage } from "@/lib/chapter-tokens";
import { DatabaseSetupError } from "@/components/setup/database-error";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PageCta } from "@/components/marketing/page-cta";
import type { Page } from "@/db/schema";
import { loadWithDatabaseSetupFallback } from "@/lib/db-errors";
import { buildStaticPageMetadata } from "@/lib/marketing/static-metadata";
import {
  formatArticleDate,
  getArticleReadingMinutes,
  getPagePublicPath,
  listPublishedArticlePages,
} from "@/lib/pages";
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
  const hydrated = articles.map((article) => applyChapterTokensToPage(article, settings));
  const [featured, ...rest] = hydrated;

  return (
    <MarketingShell>
      <header className="marketing-container pb-10 pt-12 sm:pb-14 sm:pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-bni">Insights</p>
        <h1 className="mt-3 max-w-3xl text-[clamp(2.2rem,5vw,3.75rem)] font-bold leading-[1.02] tracking-[-0.03em] text-foreground">
          Business networking insights
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          Practical writing from {settings.chapterName} on referrals, guest visits and growing a
          business through local relationships in Cheshire East.
        </p>
      </header>

      {featured ? (
        <section className="border-t border-border bg-white">
          <div className="marketing-container py-12 sm:py-16">
            <Link
              href={getPagePublicPath(featured)}
              className="group grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12"
            >
              <div>
                <ArticleMeta article={featured} label="Latest" />
                <h2 className="mt-4 text-[clamp(1.75rem,3.4vw,2.6rem)] font-bold leading-[1.08] tracking-[-0.025em] text-foreground group-hover:text-bni">
                  {featured.title}
                </h2>
              </div>
              <div className="lg:pt-8">
                <p className="text-lg leading-relaxed text-muted">
                  {featured.excerpt ?? featured.metaDescription}
                </p>
                <span className="mt-6 inline-block text-sm font-semibold text-bni">
                  Read article <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          </div>
        </section>
      ) : null}

      {rest.length > 0 ? (
        <section className="border-t border-border">
          <div className="marketing-container py-12 sm:py-16">
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((article) => (
                <li key={article.id}>
                  <Link
                    href={getPagePublicPath(article)}
                    className="group flex h-full flex-col rounded-2xl border border-border bg-white p-6 transition hover:border-bni/30 hover:shadow-md"
                  >
                    <ArticleMeta article={article} />
                    <h2 className="mt-3 text-xl font-semibold leading-snug text-foreground group-hover:text-bni">
                      {article.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                      {article.excerpt ?? article.metaDescription}
                    </p>
                    <span className="mt-auto pt-5 text-sm font-semibold text-bni">
                      Read article <span aria-hidden="true">→</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <PageCta settings={settings} />
    </MarketingShell>
  );
}

function ArticleMeta({ article, label }: { article: Page; label?: string }) {
  const date = formatArticleDate(article.publishedAt);
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
      <span className="font-semibold uppercase tracking-[0.16em] text-bni">
        {label ?? article.heroEyebrow ?? "Insight"}
      </span>
      {date ? (
        <>
          <span aria-hidden="true">·</span>
          <time dateTime={article.publishedAt?.toISOString()}>{date}</time>
        </>
      ) : null}
      <span aria-hidden="true">·</span>
      <span>{getArticleReadingMinutes(article)} min read</span>
    </p>
  );
}
