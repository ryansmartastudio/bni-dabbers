import Link from "next/link";
import type { ChapterSettings, Page } from "@/db/schema";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { FaqList } from "@/components/marketing/faq-list";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarkdownContent } from "@/components/marketing/markdown-content";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PageCta } from "@/components/marketing/page-cta";
import { VisitFormSection } from "@/components/marketing/visit-form-section";
import { applyChapterTokensToPage } from "@/lib/chapter-tokens";
import {
  formatArticleDate,
  getArticleReadingMinutes,
  getPagePublicPath,
} from "@/lib/pages";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildLocalBusinessJsonLd,
} from "@/lib/marketing/structured-data";

type ArticleViewProps = {
  page: Page;
  settings: ChapterSettings;
  relatedArticles: Page[];
};

export function ArticleView({ page, settings, relatedArticles }: ArticleViewProps) {
  const article = applyChapterTokensToPage(page, settings);
  const path = getPagePublicPath(article);
  const readingMinutes = getArticleReadingMinutes(article);
  const publishedLabel = formatArticleDate(article.publishedAt);
  const related = relatedArticles
    .filter((item) => item.id !== page.id)
    .slice(0, 3)
    .map((item) => applyChapterTokensToPage(item, settings));

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Insights", path: "/insights" },
    { name: article.title, path },
  ];

  const jsonLd = [
    buildLocalBusinessJsonLd(settings),
    buildArticleJsonLd(article, path, settings),
    buildBreadcrumbJsonLd(breadcrumbItems),
    buildFaqPageJsonLd(article.faqs),
  ].filter(Boolean) as Array<Record<string, unknown>>;

  return (
    <MarketingShell>
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={breadcrumbItems} />

      <article>
        <header className="marketing-container pb-10 pt-6 sm:pb-14 sm:pt-10">
          <div className="mx-auto max-w-3xl">
            {article.heroEyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-bni">
                {article.heroEyebrow}
              </p>
            ) : null}
            <h1 className="mt-4 text-[clamp(2.1rem,4.8vw,3.6rem)] font-bold leading-[1.04] tracking-[-0.03em] text-foreground">
              {article.title}
            </h1>
            {article.intro ? (
              <MarkdownContent
                content={article.intro}
                className="mt-6 text-xl leading-relaxed [&_p]:mt-0 [&_p]:text-xl [&_p]:leading-relaxed"
              />
            ) : null}
            <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-5 text-sm text-ink-muted">
              <span className="font-medium text-foreground">{settings.chapterName}</span>
              {publishedLabel ? (
                <>
                  <span aria-hidden="true">·</span>
                  <time dateTime={article.publishedAt?.toISOString()}>{publishedLabel}</time>
                </>
              ) : null}
              <span aria-hidden="true">·</span>
              <span>{readingMinutes} min read</span>
            </p>
          </div>
        </header>

        <div className="border-t border-border bg-white">
          <div className="marketing-container py-12 sm:py-16">
            <div className="mx-auto max-w-3xl text-[1.0625rem] [&_p]:text-[1.0625rem] [&_p]:leading-[1.75] [&_li]:leading-[1.7]">
              {article.sections.map((section) => (
                <section key={section.id} className="mt-12 first:mt-0">
                  <h2 className="text-[1.65rem] font-semibold leading-tight tracking-[-0.02em] text-foreground">
                    {section.heading}
                  </h2>
                  <div className="mt-4">
                    <MarkdownContent content={section.body} />
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </article>

      <FaqList faqs={article.faqs} />

      {related.length > 0 ? (
        <section className="border-t border-border">
          <div className="marketing-container py-12 sm:py-16">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
              Keep reading
            </h2>
            <ul className="mt-8 grid gap-6 md:grid-cols-3">
              {related.map((item) => (
                <li key={item.id}>
                  <Link
                    href={getPagePublicPath(item)}
                    className="group flex h-full flex-col rounded-2xl border border-border bg-white p-6 transition hover:border-bni/30 hover:shadow-md"
                  >
                    {item.heroEyebrow ? (
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bni">
                        {item.heroEyebrow}
                      </span>
                    ) : null}
                    <span className="mt-3 text-lg font-semibold leading-snug text-foreground group-hover:text-bni">
                      {item.title}
                    </span>
                    <span className="mt-auto pt-4 text-sm text-ink-muted">
                      {getArticleReadingMinutes(item)} min read
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <PageCta
        heading={article.ctaHeading}
        body={article.ctaBody}
        pageSlug={article.slug}
        settings={settings}
      />
      <VisitFormSection sourcePath={path} pageSlug={article.slug} settings={settings} />
    </MarketingShell>
  );
}
