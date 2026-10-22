import Link from "next/link";
import type { ChapterSettings } from "@/db/schema";

type PageCtaProps = {
  heading?: string | null;
  body?: string | null;
  pageSlug?: string;
  settings?: Pick<ChapterSettings, "meetingDay" | "chapterName">;
};

export function PageCta({ heading, body, pageSlug, settings }: PageCtaProps) {
  const visitHref = pageSlug ? `/visit?page=${pageSlug}` : "/visit";
  const defaultBody = settings
    ? `Come along to a ${settings.meetingDay} morning meeting, meet members in person, and see whether ${settings.chapterName} is the right fit for your business.`
    : "Come along to a chapter morning meeting, meet members in person, and see whether BNI Dabbers is the right fit for your business.";

  return (
    <section className="relative overflow-hidden border-t border-border bg-[#fffdf9]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(135deg, color-mix(in srgb, var(--color-bni-red) 6%, transparent), transparent 55%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
        <p className="marketing-eyebrow">Next step</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-foreground">
          {heading ?? "Visit as a guest"}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted">
          {body ?? defaultBody}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={visitHref} className="marketing-primary-button">
            Request a guest visit
          </Link>
          <Link href="/directory" className="marketing-secondary-button">
            Browse the directory
          </Link>
        </div>
      </div>
    </section>
  );
}
