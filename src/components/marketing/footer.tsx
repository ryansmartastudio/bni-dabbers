import Link from "next/link";
import type { ChapterSettings, Page } from "@/db/schema";
import { getPagePublicPath } from "@/lib/pages";

type FooterProps = {
  settings: ChapterSettings;
  locationPages?: Page[];
};

export function Footer({ settings, locationPages = [] }: FooterProps) {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold tracking-wide text-foreground">
            {settings.chapterName}
          </p>
          <p className="mt-2 text-sm text-muted">Cheshire East business networking</p>
          <address className="mt-4 not-italic text-sm leading-relaxed text-muted">
            {settings.venueName}
            <br />
            {settings.venueAddress}
            <br />
            {settings.meetingDay}s · {settings.meetingStart}–{settings.meetingEnd}
          </address>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
            Explore
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/" className="text-muted hover:text-foreground">
                Home
              </Link>
            </li>
            <li>
              <Link href="/networking-groups" className="text-muted hover:text-foreground">
                Networking groups
              </Link>
            </li>
            <li>
              <Link href="/directory" className="text-muted hover:text-foreground">
                Member directory
              </Link>
            </li>
            <li>
              <Link href="/visit" className="text-muted hover:text-foreground">
                Visit as a guest
              </Link>
            </li>
            <li>
              <Link href="/trades" className="text-muted hover:text-foreground">
                Trades directory
              </Link>
            </li>
            <li>
              <Link href="/insights" className="text-muted hover:text-foreground">
                Insights
              </Link>
            </li>
            <li>
              <Link href="/llms.txt" className="text-muted hover:text-foreground">
                AI / LLM index
              </Link>
            </li>
            <li>
              <Link href="/md/index.md" className="text-muted hover:text-foreground">
                Markdown site map
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
            Areas we serve
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {locationPages.length > 0 ? (
              locationPages.map((page) => (
                <li key={page.id}>
                  <Link
                    href={getPagePublicPath(page)}
                    className="text-muted hover:text-foreground"
                  >
                    {page.locationName ?? page.title}
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-muted">Cheshire East · Crewe · Nantwich · Sandbach</li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} {settings.chapterName}</p>
          <p>Referral-first business networking in Cheshire East</p>
        </div>
      </div>
    </footer>
  );
}
