import Image from "next/image";
import Link from "next/link";
import type { ChapterSettings, Page } from "@/db/schema";
import { MarkdownContent } from "@/components/marketing/markdown-content";
import { formatNextMeetingDate } from "@/lib/meeting-date";

type PageHeroProps = {
  page: Pick<
    Page,
    "title" | "heroEyebrow" | "intro" | "heroImageUrl" | "slug"
  >;
  settings: ChapterSettings;
  memberCount?: number;
  showMeetingFacts?: boolean;
};

export function PageHero({
  page,
  settings,
  memberCount,
  showMeetingFacts = true,
}: PageHeroProps) {
  const visitHref = page.slug ? `/visit?page=${page.slug}` : "/visit";
  const nextMeeting = formatNextMeetingDate(settings.meetingDay);

  return (
    <section className="relative overflow-hidden border-b border-border bg-[#fffdf9]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 0%, color-mix(in srgb, var(--color-bni-red) 8%, transparent), transparent 42%), radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--color-border) 55%, transparent), transparent 36%)",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-1 bg-bni" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-end lg:py-16">
        <div className="max-w-3xl">
          {page.heroEyebrow ? (
            <p className="marketing-eyebrow">{page.heroEyebrow}</p>
          ) : null}
          <h1 className="mt-3 text-[clamp(2.2rem,5.5vw,4.25rem)] font-bold leading-[0.98] tracking-[-0.03em] text-foreground">
            {page.title}
          </h1>
          {page.intro ? (
            <div className="mt-5 max-w-2xl text-lg leading-relaxed">
              <MarkdownContent content={page.intro} />
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={visitHref} className="marketing-primary-button">
              Request a guest visit
            </Link>
            <Link href="/directory" className="marketing-secondary-button">
              Browse members
            </Link>
          </div>

          {showMeetingFacts ? (
            <dl className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="marketing-fact-card px-4 py-4">
                <dt className="marketing-eyebrow">When</dt>
                <dd className="mt-2 text-sm font-medium text-foreground">
                  {settings.meetingDay}s
                  <span className="block text-muted">
                    {settings.meetingStart}–{settings.meetingEnd}
                  </span>
                  {nextMeeting ? (
                    <span className="mt-1 block text-xs text-muted">Next: {nextMeeting}</span>
                  ) : null}
                </dd>
              </div>
              <div className="marketing-fact-card px-4 py-4">
                <dt className="marketing-eyebrow">Where</dt>
                <dd className="mt-2 text-sm font-medium text-foreground">
                  {settings.venueName}
                  <span className="block text-muted">{settings.venueAddress}</span>
                </dd>
              </div>
              <div className="marketing-fact-card px-4 py-4">
                <dt className="marketing-eyebrow">Chapter</dt>
                <dd className="mt-2 text-sm font-medium text-foreground">
                  {memberCount != null ? `${memberCount} active members` : settings.chapterName}
                  <span className="block text-muted">Referral-first BNI chapter</span>
                </dd>
              </div>
            </dl>
          ) : null}
        </div>

        <div className="relative min-h-[280px] overflow-hidden rounded-[1.4rem] border border-border bg-surface-muted shadow-[0_24px_60px_-40px_rgba(23,20,18,0.45)]">
          {page.heroImageUrl ? (
            <Image
              src={page.heroImageUrl}
              alt={page.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority
            />
          ) : settings.venuePhotoUrl ? (
            <Image
              src={settings.venuePhotoUrl}
              alt={`${settings.venueName} venue`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority
            />
          ) : (
            <div className="flex h-full min-h-[280px] flex-col justify-end bg-surface-muted p-6">
              <p className="text-sm font-medium text-foreground">{settings.venueName}</p>
              <p className="mt-1 text-sm text-muted">{settings.venueAddress}</p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(23,20,18,0.72))] px-5 py-4 text-white">
            <p className="text-sm font-medium">{settings.chapterName}</p>
            <p className="text-xs text-white/80">
              Guests welcome · arrive from {settings.meetingStart}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
