import Link from "next/link";

type TradeLandingHeroProps = {
  eyebrow?: string;
  title: string;
  intro: string;
};

export function TradeLandingHero({
  eyebrow = "Trade directory",
  title,
  intro,
}: TradeLandingHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-[#fffdf9]">
      <div className="absolute inset-x-0 top-0 h-1 bg-bni" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="marketing-eyebrow">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.02] tracking-[-0.03em] text-foreground">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{intro}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/visit" className="marketing-primary-button">
            Request a guest visit
          </Link>
          <a href="#members" className="marketing-secondary-button">
            Chapter members
          </a>
          <Link href="/trades" className="marketing-secondary-button">
            All trades
          </Link>
        </div>
      </div>
    </section>
  );
}
