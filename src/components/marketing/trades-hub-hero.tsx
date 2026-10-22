import Link from "next/link";
import type { ChapterSettings } from "@/db/schema";

type TradesHubHeroProps = {
  settings: ChapterSettings;
  tradeCount: number;
  memberCount: number;
};

export function TradesHubHero({
  settings,
  tradeCount,
  memberCount,
}: TradesHubHeroProps) {
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
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="max-w-3xl">
          <p className="marketing-eyebrow">Trade directory</p>
          <h1 className="mt-3 text-[clamp(2.2rem,5.5vw,4rem)] font-bold leading-[0.98] tracking-[-0.03em] text-foreground">
            Find a professional by trade
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Every category below is held by an active {settings.chapterName} member — referred
            weekly by local business owners across Cheshire East.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/visit" className="marketing-primary-button">
              Visit as a guest
            </Link>
            <Link href="/directory" className="marketing-secondary-button">
              Member directory
            </Link>
            <Link href="/open-seats" className="marketing-secondary-button">
              Open seats
            </Link>
          </div>
        </div>

        <dl className="mt-10 grid gap-4 sm:grid-cols-3 lg:max-w-4xl">
          <div className="marketing-fact-card px-4 py-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
              Categories
            </dt>
            <dd className="mt-2 text-sm font-medium text-foreground">
              {tradeCount} active trades
              <span className="block text-muted">One seat per specialty</span>
            </dd>
          </div>
          <div className="marketing-fact-card px-4 py-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
              Members
            </dt>
            <dd className="mt-2 text-sm font-medium text-foreground">
              {memberCount} in the room
              <span className="block text-muted">Referred by peers weekly</span>
            </dd>
          </div>
          <div className="marketing-fact-card px-4 py-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
              Meetings
            </dt>
            <dd className="mt-2 text-sm font-medium text-foreground">
              {settings.meetingDay}s · {settings.meetingStart}–{settings.meetingEnd}
              <span className="block text-muted">{settings.venueName}</span>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
