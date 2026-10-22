import Link from "next/link";
import type { Page } from "@/db/schema";
import { getPagePublicPath } from "@/lib/pages";

type LocationsGridProps = {
  pages: Page[];
  heading?: string;
  intro?: string;
};

export function LocationsGrid({
  pages,
  heading = "Networking groups near you",
  intro = "Explore how BNI Dabbers serves business owners across Cheshire East and surrounding towns.",
}: LocationsGridProps) {
  if (pages.length === 0) return null;

  return (
    <section className="border-t border-border bg-surface-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-foreground">
            {heading}
          </h2>
          <p className="mt-3 text-base text-muted">{intro}</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Link
              key={page.id}
              href={getPagePublicPath(page)}
              className="rounded-2xl border border-border bg-white p-6 shadow-[0_18px_40px_-34px_rgba(23,20,18,0.45)] transition hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--color-bni-red)_35%,var(--color-border))]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
                {page.locationName ?? "Cheshire East"}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">{page.title}</h3>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                {page.metaDescription}
              </p>
              <span className="mt-4 inline-flex text-sm font-semibold text-bni">
                Read more →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
