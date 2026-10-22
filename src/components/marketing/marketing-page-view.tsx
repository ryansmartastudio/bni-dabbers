import type { ChapterSettings, Member, Page } from "@/db/schema";
import { FaqList } from "@/components/marketing/faq-list";
import { JsonLd } from "@/components/marketing/json-ld";
import { LocationsGrid } from "@/components/marketing/locations-grid";
import { MarkdownSections } from "@/components/marketing/markdown-sections";
import { MemberPreview } from "@/components/marketing/member-preview";
import { PageCta } from "@/components/marketing/page-cta";
import { PageHero } from "@/components/marketing/page-hero";
import { VisitFormSection } from "@/components/marketing/visit-form-section";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { TyfcbBanner } from "@/components/marketing/tyfcb-banner";
import {
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildLocalBusinessJsonLd,
  buildWebPageJsonLd,
  buildWeeklyMeetingEventJsonLd,
} from "@/lib/marketing/structured-data";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { applyChapterTokensToPage } from "@/lib/chapter-tokens";
import { getPagePublicPath } from "@/lib/pages";

type MarketingPageViewProps = {
  page: Page;
  settings: ChapterSettings;
  members: Member[];
  memberCount: number;
  locationPages?: Page[];
  relatedLocations?: Page[];
  showLocationsGrid?: boolean;
  showMemberPreview?: boolean;
  showVisitForm?: boolean;
  showMeetingFacts?: boolean;
  showTyfcbBanner?: boolean;
};

export function MarketingPageView({
  page,
  settings,
  members,
  memberCount,
  locationPages = [],
  relatedLocations = [],
  showLocationsGrid = false,
  showMemberPreview = true,
  showVisitForm = true,
  showMeetingFacts = true,
  showTyfcbBanner = false,
}: MarketingPageViewProps) {
  const hydratedPage = applyChapterTokensToPage(page, settings);
  const hydratedLocationPages = locationPages.map((item) =>
    applyChapterTokensToPage(item, settings),
  );
  const hydratedRelatedLocations = relatedLocations.map((item) =>
    applyChapterTokensToPage(item, settings),
  );
  const path = getPagePublicPath(hydratedPage);
  const previewMembers = members.slice(0, 8);
  const faqJsonLd = buildFaqPageJsonLd(hydratedPage.faqs);
  const breadcrumbItems =
    page.kind === "home"
      ? [{ name: "Home", path: "/" }]
      : page.kind === "article"
        ? [
            { name: "Home", path: "/" },
            { name: "Insights", path: "/insights" },
            { name: hydratedPage.title, path },
          ]
        : page.kind === "standard"
          ? [
              { name: "Home", path: "/" },
              { name: hydratedPage.title, path },
            ]
          : [
              { name: "Home", path: "/" },
              { name: "Networking groups", path: "/networking-groups" },
              { name: hydratedPage.title, path },
            ];

  const jsonLd = [
    buildLocalBusinessJsonLd(settings),
    buildWeeklyMeetingEventJsonLd(settings),
    buildWebPageJsonLd(hydratedPage, path),
    buildBreadcrumbJsonLd(breadcrumbItems),
    faqJsonLd,
  ].filter(Boolean) as Array<Record<string, unknown>>;

  return (
    <MarketingShell>
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={breadcrumbItems} />
      <PageHero
        page={hydratedPage}
        settings={settings}
        memberCount={memberCount}
        showMeetingFacts={showMeetingFacts}
      />
      {showTyfcbBanner ? (
        <div className="marketing-container -mt-4 pb-8">
          <TyfcbBanner settings={settings} />
        </div>
      ) : null}
      <MarkdownSections sections={hydratedPage.sections} />
      {showMemberPreview ? (
        <MemberPreview members={previewMembers} memberCount={memberCount} />
      ) : null}
      {showLocationsGrid ? (
        <LocationsGrid pages={hydratedLocationPages} />
      ) : hydratedRelatedLocations.length > 0 ? (
        <LocationsGrid
          pages={hydratedRelatedLocations}
          heading="Other areas we cover"
          intro="Explore networking information for nearby towns served by BNI Dabbers."
        />
      ) : null}
      <FaqList faqs={hydratedPage.faqs} />
      <PageCta
        heading={hydratedPage.ctaHeading}
        body={hydratedPage.ctaBody}
        pageSlug={hydratedPage.slug}
        settings={settings}
      />
      {showVisitForm ? (
        <VisitFormSection sourcePath={path} pageSlug={hydratedPage.slug} settings={settings} />
      ) : null}
    </MarketingShell>
  );
}
