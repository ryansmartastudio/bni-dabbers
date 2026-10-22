import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { FaqList } from "@/components/marketing/faq-list";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PageCta } from "@/components/marketing/page-cta";
import { TradeLandingHero } from "@/components/marketing/trade-landing-hero";
import { PublicMemberCard } from "@/components/directory/public-member-card";
import { DatabaseSetupError } from "@/components/setup/database-error";
import { loadWithDatabaseSetupFallback } from "@/lib/db-errors";
import { buildFaqPageJsonLd } from "@/lib/marketing/structured-data";
import { buildStaticPageMetadata } from "@/lib/marketing/static-metadata";
import { getTradeCopy, getTradeGroups } from "@/lib/trades";
import { getChapterSettings } from "@/lib/settings";

export const revalidate = 3600;

type TradePageProps = PageProps<"/trades/[slug]">;

export const dynamicParams = true;

export async function generateStaticParams() {
  const { safeGenerateStaticParams } = await import("@/lib/build-time-db");
  return safeGenerateStaticParams(async () => {
    const groups = await getTradeGroups();
    return groups.map((group) => ({ slug: group.slug }));
  });
}

export async function generateMetadata({ params }: TradePageProps): Promise<Metadata> {
  const { slug } = await params;
  const groups = await getTradeGroups();
  const group = groups.find((item) => item.slug === slug);
  if (!group) return { title: "Trade not found" };

  const copy = getTradeCopy(slug, group.seatLabel);
  return buildStaticPageMetadata(`/trades/${slug}`, copy.metaTitle, copy.metaDescription);
}

export default async function TradeLandingPage({ params }: TradePageProps) {
  const { slug } = await params;

  const result = await loadWithDatabaseSetupFallback(async () => {
    const [settings, groups] = await Promise.all([
      getChapterSettings(),
      getTradeGroups(),
    ]);
    return { settings, groups };
  });

  if (!result.ok) {
    return <DatabaseSetupError message={result.setupError} />;
  }

  const { settings, groups } = result.data;
  const group = groups.find((item) => item.slug === slug);
  if (!group) {
    notFound();
  }

  const copy = getTradeCopy(slug, group.seatLabel);
  const faqJsonLd = buildFaqPageJsonLd(copy.faqs);
  const memberLabel =
    group.members.length === 1 ? "1 chapter member" : `${group.members.length} chapter members`;

  return (
    <MarketingShell>
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Trades", path: "/trades" },
          { name: group.seatLabel, path: `/trades/${slug}` },
        ]}
      />
      <TradeLandingHero title={copy.title} intro={copy.intro} />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <section id="members">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
                Chapter members
              </h2>
              <p className="mt-2 text-muted">{memberLabel} in this BNI seat</p>
            </div>
            <Link href="/directory" className="text-sm font-semibold text-bni hover:underline">
              Full directory →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {group.members.map((member) => (
              <PublicMemberCard key={member.id} member={member} />
            ))}
          </div>
        </section>

        <section className="marketing-section-card mt-12">
          <h2 className="text-xl font-semibold text-foreground">{copy.buyerGuideHeading}</h2>
          <p className="mt-3 leading-relaxed text-muted">{copy.buyerGuideBody}</p>
        </section>

        <div className="mt-12">
          <FaqList heading="Common questions" faqs={copy.faqs} />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/trades" className="marketing-secondary-button">
            All trades
          </Link>
          <Link href="/networking-groups" className="marketing-secondary-button">
            Towns we serve
          </Link>
        </div>
      </div>

      <PageCta
        settings={settings}
        heading="Need an introduction?"
        body={`Visit a ${settings.meetingDay} meeting and meet these members in person before you hire.`}
      />
    </MarketingShell>
  );
}
