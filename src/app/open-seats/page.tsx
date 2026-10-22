import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { OpenSeatsHero } from "@/components/marketing/open-seats-hero";
import { PageCta } from "@/components/marketing/page-cta";
import { DatabaseSetupError } from "@/components/setup/database-error";
import { loadWithDatabaseSetupFallback } from "@/lib/db-errors";
import { buildStaticPageMetadata } from "@/lib/marketing/static-metadata";
import { getOpenSeatLabels } from "@/lib/trades";
import { getChapterSettings } from "@/lib/settings";

export const revalidate = 3600;

export const metadata: Metadata = buildStaticPageMetadata(
  "/open-seats",
  "Open BNI seats in Cheshire East",
  "Categories open at BNI Dabbers — one seat per profession. Apply before your competitor locks the category.",
);

export default async function OpenSeatsPage() {
  const result = await loadWithDatabaseSetupFallback(async () => {
    const [settings, openSeats] = await Promise.all([
      getChapterSettings(),
      getOpenSeatLabels(),
    ]);
    return { settings, openSeats };
  });

  if (!result.ok) {
    return <DatabaseSetupError message={result.setupError} />;
  }

  const { settings, openSeats } = result.data;

  return (
    <MarketingShell>
      <OpenSeatsHero settings={settings} openCount={openSeats.length} />
      <section className="border-t border-border bg-surface-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          {openSeats.length === 0 ? (
            <div className="marketing-section-card max-w-2xl">
              <p className="text-lg font-medium text-foreground">
                All listed recruitment categories are filled.
              </p>
              <p className="mt-3 text-muted">
                <Link href="/visit" className="font-semibold text-bni hover:underline">
                  Visit as a guest
                </Link>{" "}
                to ask about waitlist categories, or{" "}
                <Link href="/trades" className="font-semibold text-bni hover:underline">
                  browse filled trades
                </Link>
                .
              </p>
            </div>
          ) : (
            <>
              <div className="max-w-2xl">
                <h2 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
                  Seats open for recruitment
                </h2>
                <p className="mt-3 text-muted">
                  Each card is a specialty you can apply for at the chapter. First qualified applicant
                  typically holds the seat.
                </p>
              </div>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {openSeats.map((seat) => (
                  <li
                    key={seat}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--color-bni-red)_45%,var(--color-border))] bg-white p-6 shadow-[0_18px_40px_-34px_rgba(23,20,18,0.35)]"
                  >
                    <div>
                      <span className="inline-flex rounded-full bg-[color-mix(in_srgb,var(--color-bni-red)_10%,white)] px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-bni">
                        Open
                      </span>
                      <p className="mt-3 text-lg font-semibold text-foreground">{seat}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
      <PageCta
        settings={settings}
        heading="Interested in joining?"
        body="Request a guest visit, meet the chapter, and apply for your open seat."
        pageSlug={undefined}
      />
    </MarketingShell>
  );
}
