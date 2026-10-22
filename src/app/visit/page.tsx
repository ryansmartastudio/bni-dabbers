import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { TyfcbBanner } from "@/components/marketing/tyfcb-banner";
import { VisitForm } from "@/components/marketing/visit-form";
import { DatabaseSetupError } from "@/components/setup/database-error";
import { loadWithDatabaseSetupFallback } from "@/lib/db-errors";
import { formatNextMeetingDate } from "@/lib/meeting-date";
import { getPublishedPageBySlug } from "@/lib/pages";
import { getChapterSettings } from "@/lib/settings";
import { buildStaticPageMetadata } from "@/lib/marketing/static-metadata";

export const revalidate = 3600;

export const metadata: Metadata = buildStaticPageMetadata(
  "/visit",
  "Visit as a guest",
  "Request a guest visit to BNI Dabbers — Thursday morning business networking in Cheshire East.",
);

type VisitPageProps = PageProps<"/visit">;

export default async function VisitPage({ searchParams }: VisitPageProps) {
  const resolvedSearchParams = await searchParams;
  const pageSlug =
    typeof resolvedSearchParams.page === "string"
      ? resolvedSearchParams.page
      : undefined;

  const result = await loadWithDatabaseSetupFallback(async () => {
    const [settings, page] = await Promise.all([
      getChapterSettings(),
      pageSlug ? getPublishedPageBySlug(pageSlug) : Promise.resolve(null),
    ]);
    return { settings, page };
  });

  if (!result.ok) {
    return <DatabaseSetupError message={result.setupError} />;
  }

  const { settings, page } = result.data;
  const nextMeeting = formatNextMeetingDate(settings.meetingDay);

  return (
    <MarketingShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-8">
          <TyfcbBanner settings={settings} />
        </div>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
          <div>
            <p className="marketing-eyebrow">Guest visit</p>
            <h1 className="mt-3 text-4xl font-bold tracking-[-0.03em] text-foreground">
              Request a visit to {settings.chapterName}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted">
              {page?.locationName
                ? `Interested in networking near ${page.locationName}? `
                : null}
              Tell us about your business and we&apos;ll arrange a guest place at
              the next suitable {settings.meetingDay} morning meeting.
            </p>
            <dl className="mt-8 space-y-4 rounded-2xl border border-border bg-white p-5">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
                  When
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {settings.meetingDay}s · {settings.meetingStart}–{settings.meetingEnd}
                  {nextMeeting ? (
                    <span className="mt-1 block text-muted">Next meeting: {nextMeeting}</span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
                  Where
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {settings.venueName}
                  <span className="block text-muted">{settings.venueAddress}</span>
                </dd>
              </div>
            </dl>
            <p className="mt-6 text-sm text-muted">
              Explore{" "}
              <Link href="/networking-groups" className="font-semibold text-bni hover:underline">
                town guides
              </Link>
              , the{" "}
              <Link href="/trades" className="font-semibold text-bni hover:underline">
                trade directory
              </Link>{" "}
              or{" "}
              <Link href="/directory" className="font-semibold text-bni hover:underline">
                member profiles
              </Link>{" "}
              before you visit.
            </p>
          </div>
          <VisitForm sourcePath="/visit" pageSlug={pageSlug} />
        </div>
      </div>
    </MarketingShell>
  );
}
