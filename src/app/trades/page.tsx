import type { Metadata } from "next";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { OpenSeatsCallout } from "@/components/marketing/open-seats-callout";
import { PageCta } from "@/components/marketing/page-cta";
import { TradesGrid } from "@/components/marketing/trades-grid";
import { TradesHubHero } from "@/components/marketing/trades-hub-hero";
import { TyfcbBanner } from "@/components/marketing/tyfcb-banner";
import { DatabaseSetupError } from "@/components/setup/database-error";
import { loadWithDatabaseSetupFallback } from "@/lib/db-errors";
import { buildStaticPageMetadata } from "@/lib/marketing/static-metadata";
import { absoluteUrl } from "@/lib/site-url";
import { getTradeGroups } from "@/lib/trades";
import { getChapterSettings } from "@/lib/settings";

export const revalidate = 3600;

export const metadata: Metadata = buildStaticPageMetadata(
  "/trades",
  "Trades and professions | BNI Dabbers directory",
  "Browse BNI Dabbers members by trade — accountants, designers and more across Cheshire East.",
);

export default async function TradesHubPage() {
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
  const memberCount = groups.reduce((sum, group) => sum + group.members.length, 0);
  const gridItems = groups.map((group) => ({
    slug: group.slug,
    seatLabel: group.seatLabel,
    memberCount: group.members.length,
  }));

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${settings.chapterName} trades`,
    itemListElement: groups.map((group, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: group.seatLabel,
      url: absoluteUrl(`/trades/${group.slug}`),
    })),
  };

  return (
    <MarketingShell>
      <JsonLd data={itemListJsonLd} />
      <TradesHubHero
        settings={settings}
        tradeCount={groups.length}
        memberCount={memberCount}
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <TyfcbBanner settings={settings} variant="banner" />
      </div>
      <TradesGrid groups={gridItems} />
      <OpenSeatsCallout />
      <PageCta
        settings={settings}
        heading="Need an introduction?"
        body={`Visit a ${settings.meetingDay} meeting and meet members in person before you hire — or ask the chapter for a warm referral.`}
      />
    </MarketingShell>
  );
}
