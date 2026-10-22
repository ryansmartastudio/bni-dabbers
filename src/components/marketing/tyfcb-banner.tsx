import type { ChapterSettings } from "@/db/schema";
import {
  formatTyfcbHeadline,
  formatTyfcbVerifiedMonth,
  isTyfcbDisplayEnabled,
  isTyfcbStale,
} from "@/lib/tyfcb";

type TyfcbBannerProps = {
  settings: ChapterSettings;
  variant?: "banner" | "compact";
};

export function TyfcbBanner({ settings, variant = "banner" }: TyfcbBannerProps) {
  if (!isTyfcbDisplayEnabled(settings)) {
    return null;
  }

  const headline = formatTyfcbHeadline(settings);
  const verified = formatTyfcbVerifiedMonth(settings);
  const stale = isTyfcbStale(settings.tyfcbCheckedAt);

  const claim = stale
    ? `Our members report strong referral results through BNI Dabbers.`
    : `Our members passed ${headline} of business to each other in the last 12 months.`;

  if (variant === "compact") {
    return (
      <p className="text-sm font-medium text-foreground">
        {claim}
        {verified ? (
          <span className="mt-1 block text-xs font-normal text-muted">
            Verified from BNI Connect{stale ? "" : `, ${verified}`}
          </span>
        ) : null}
      </p>
    );
  }

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--color-bni-red)_25%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-bni-red)_6%,white)] px-6 py-8 text-center sm:px-10"
      aria-label="Chapter referral results"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-bni">
        Chapter results
      </p>
      {!stale ? (
        <p className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {headline}
        </p>
      ) : null}
      <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
        {claim}
      </p>
      {verified ? (
        <p className="mt-3 text-xs text-muted">
          Verified from BNI Connect{stale ? "" : ` · ${verified}`}
        </p>
      ) : null}
    </section>
  );
}
