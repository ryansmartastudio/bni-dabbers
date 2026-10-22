import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { LocationsGrid } from "@/components/marketing/locations-grid";
import { PageCta } from "@/components/marketing/page-cta";
import { DatabaseSetupError } from "@/components/setup/database-error";
import { applyChapterTokensToPage } from "@/lib/chapter-tokens";
import { loadWithDatabaseSetupFallback } from "@/lib/db-errors";
import { listPublishedLocationPages } from "@/lib/pages";
import { getChapterSettings } from "@/lib/settings";
import { buildStaticPageMetadata } from "@/lib/marketing/static-metadata";

export const revalidate = 3600;

export const metadata: Metadata = buildStaticPageMetadata(
  "/networking-groups",
  "Networking groups in Cheshire East",
  "Find business networking groups near Nantwich, Crewe, Sandbach and across Cheshire East with BNI Dabbers.",
);

export default async function NetworkingGroupsHubPage() {
  const result = await loadWithDatabaseSetupFallback(async () => {
    const [locationPages, settings] = await Promise.all([
      listPublishedLocationPages(),
      getChapterSettings(),
    ]);
    return { locationPages, settings };
  });

  if (!result.ok) {
    return <DatabaseSetupError message={result.setupError} />;
  }

  const { locationPages, settings } = result.data;
  const hydratedLocationPages = locationPages.map((page) =>
    applyChapterTokensToPage(page, settings),
  );

  return (
    <MarketingShell>
      <section className="relative overflow-hidden border-b border-border bg-[#fffdf9]">
        <div className="absolute inset-x-0 top-0 h-1 bg-bni" aria-hidden="true" />
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="marketing-eyebrow">Cheshire East</p>
          <h1 className="mt-3 text-4xl font-bold tracking-[-0.03em] text-foreground sm:text-5xl">
            Networking groups near Nantwich, Crewe and Cheshire East
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            {settings.chapterName} meets weekly at {settings.venueName} ({settings.venueAddress}).
            These guides explain how the chapter serves business owners searching for structured
            networking in towns across the region.
          </p>
          <div className="mt-8">
            <Link href="/visit" className="marketing-primary-button">
              Request a guest visit
            </Link>
          </div>
        </div>
      </section>
      <LocationsGrid pages={hydratedLocationPages} />
      <PageCta settings={settings} />
    </MarketingShell>
  );
}
