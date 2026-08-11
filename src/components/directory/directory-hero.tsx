import Image from "next/image";
import Link from "next/link";
import type { ChapterSettings } from "@/db/schema";
import { normalizeWebsiteUrl } from "@/lib/members";

type DirectoryHeroProps = {
  settings: ChapterSettings;
  memberCount: number;
};

function formatChapterWebsite(url: string) {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export function DirectoryHero({ settings, memberCount }: DirectoryHeroProps) {
  const chapterWebsite = settings.websiteUrl
    ? normalizeWebsiteUrl(settings.websiteUrl)
    : null;

  return (
    <section className="relative overflow-hidden border-b border-border bg-[#fffdf9]">
      <div className="absolute inset-x-0 top-0 h-1 bg-bni" aria-hidden="true" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-end lg:py-16">
        <div className="max-w-3xl">
          <h1 className="text-[clamp(2.6rem,6vw,4.75rem)] font-bold leading-[0.95] tracking-[-0.03em] text-foreground">
            {settings.chapterName}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            A referral-first business community meeting every {settings.meetingDay}{" "}
            morning. Browse {memberCount} active members, scan to connect on LinkedIn,
            and find the right seat for your next introduction.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#members"
              className="inline-flex items-center justify-center rounded-md bg-bni px-5 py-3 text-sm font-semibold text-white transition hover:bg-bni-dark"
            >
              Browse members
            </a>
            {chapterWebsite ? (
              <a
                href={chapterWebsite}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
              >
                Visit chapter page
              </a>
            ) : null}
          </div>

          <dl className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
                When
              </dt>
              <dd className="mt-2 text-sm font-medium text-foreground">
                {settings.meetingDay}s
                <span className="block text-muted">
                  {settings.meetingStart}–{settings.meetingEnd}
                </span>
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
                Where
              </dt>
              <dd className="mt-2 text-sm font-medium text-foreground">
                {settings.venueName}
                <span className="block text-muted">{settings.venueAddress}</span>
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
                Chapter
              </dt>
              <dd className="mt-2 text-sm font-medium text-foreground">
                {memberCount} active members
                {chapterWebsite ? (
                  <Link
                    href={chapterWebsite}
                    target="_blank"
                    className="block text-bni hover:underline"
                  >
                    {formatChapterWebsite(settings.websiteUrl)}
                  </Link>
                ) : null}
              </dd>
            </div>
          </dl>
        </div>

        <div className="relative min-h-[260px] overflow-hidden rounded-[1.4rem] border border-border bg-surface-muted shadow-[0_24px_60px_-40px_rgba(23,20,18,0.45)]">
          {settings.venuePhotoUrl ? (
            <Image
              src={settings.venuePhotoUrl}
              alt={`${settings.venueName} venue`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority
            />
          ) : settings.chapterLogoUrl ? (
            <div className="flex h-full min-h-[260px] items-center justify-center bg-white p-10">
              <Image
                src={settings.chapterLogoUrl}
                alt={`${settings.chapterName} logo`}
                width={220}
                height={220}
                className="h-auto w-full max-w-[220px] object-contain"
              />
            </div>
          ) : (
            <div className="flex h-full min-h-[260px] flex-col justify-end bg-surface-muted p-6">
              <p className="text-sm font-medium text-foreground">{settings.venueName}</p>
              <p className="mt-1 text-sm text-muted">{settings.venueAddress}</p>
              <p className="mt-4 text-xs text-muted">
                Add a venue photo in Settings to show it here.
              </p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(23,20,18,0.72))] px-5 py-4 text-white">
            <p className="text-sm font-medium">{settings.venueName}</p>
            <p className="text-xs text-white/80">
              Guests welcome · arrive from {settings.meetingStart}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
