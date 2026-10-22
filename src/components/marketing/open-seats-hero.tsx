import Link from "next/link";
import type { ChapterSettings } from "@/db/schema";

type OpenSeatsHeroProps = {
  settings: ChapterSettings;
  openCount: number;
};

export function OpenSeatsHero({ settings, openCount }: OpenSeatsHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-[#fffdf9]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 0%, color-mix(in srgb, var(--color-bni-red) 8%, transparent), transparent 42%)",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-1 bg-bni" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="max-w-3xl">
          <p className="marketing-eyebrow">Open categories</p>
          <h1 className="mt-3 text-[clamp(2.2rem,5.5vw,3.75rem)] font-bold leading-[0.98] tracking-[-0.03em] text-foreground">
            Open categories at {settings.chapterName}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            BNI allows one member per professional specialty. These seats are currently open or
            recruiting — lock your category before a competitor does.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/visit" className="marketing-primary-button">
              Apply via guest visit
            </Link>
            <Link href="/trades" className="marketing-secondary-button">
              Browse filled trades
            </Link>
          </div>
          {openCount > 0 ? (
            <p className="mt-8 inline-flex rounded-full border border-[color-mix(in_srgb,var(--color-bni-red)_30%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-bni-red)_6%,white)] px-4 py-2 text-sm font-medium text-foreground">
              {openCount} {openCount === 1 ? "seat" : "seats"} open for recruitment
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
