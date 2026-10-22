import type { ChapterSettings } from "@/db/schema";

export const DEFAULT_TYFCB_SOURCE_URL =
  "https://www.bniconnectglobal.com/bnicms/v3/frontend/consume/getTYFCBValue?encodedChapterId=p2V0q0Ue4Kd4%2BLprzddwng%3D%3D";

const STALE_DAYS = 45;
const MIN_SANITY_RATIO = 0.5;
const MAX_SANITY_RATIO = 3;

export type TyfcbFetchResult = {
  amount: number;
  currency: string;
};

export function parseTyfcbAmount(raw: string) {
  const normalized = raw.replace(/,/g, "").trim();
  const amount = Number.parseInt(normalized, 10);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid TYFCB amount");
  }
  return amount;
}

export async function fetchTyfcbFromBni(sourceUrl: string): Promise<TyfcbFetchResult> {
  const response = await fetch(sourceUrl, {
    headers: {
      Accept: "application/json",
      Referer: "https://bni-ce.co.uk/cheshire-east-dabbers/en-GB/index",
      "User-Agent": "BNIDabbers-TYFCB-Sync/1.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`BNI TYFCB API returned ${response.status}`);
  }

  const data = (await response.json()) as {
    tyfcbval?: string;
    currencycode?: string;
  };

  if (!data.tyfcbval) {
    throw new Error("BNI TYFCB API missing tyfcbval");
  }

  return {
    amount: parseTyfcbAmount(data.tyfcbval),
    currency: data.currencycode?.trim() || "GBP",
  };
}

export function isTyfcbSanityOk(previous: number | null | undefined, next: number) {
  if (!previous || previous <= 0) return true;
  const ratio = next / previous;
  return ratio >= MIN_SANITY_RATIO && ratio <= MAX_SANITY_RATIO;
}

export function isTyfcbStale(checkedAt: Date | null | undefined) {
  if (!checkedAt) return true;
  const ageMs = Date.now() - checkedAt.getTime();
  return ageMs > STALE_DAYS * 24 * 60 * 60 * 1000;
}

export function getTyfcbAmount(settings: Pick<ChapterSettings, "tyfcbAmount">) {
  if (settings.tyfcbAmount == null) return null;
  const numeric = Number(settings.tyfcbAmount);
  return Number.isFinite(numeric) ? numeric : null;
}

export function formatTyfcbExact(
  settings: Pick<ChapterSettings, "tyfcbAmount" | "tyfcbCurrency">,
) {
  const amount = getTyfcbAmount(settings);
  if (amount == null) return "";
  const currency = settings.tyfcbCurrency ?? "GBP";
  if (currency === "GBP") {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return `${amount.toLocaleString("en-GB")} ${currency}`;
}

export function formatTyfcbHeadline(
  settings: Pick<ChapterSettings, "tyfcbAmount" | "tyfcbCurrency">,
) {
  const amount = getTyfcbAmount(settings);
  if (amount == null) return "";
  const currency = settings.tyfcbCurrency ?? "GBP";
  if (currency === "GBP") {
    if (amount >= 1_000_000) {
      const millions = amount / 1_000_000;
      return `£${millions.toFixed(2)} million`;
    }
    return formatTyfcbExact(settings);
  }
  return formatTyfcbExact(settings);
}

export function formatTyfcbVerifiedMonth(
  settings: Pick<ChapterSettings, "tyfcbCheckedAt" | "tyfcbUpdatedAt">,
) {
  const date = settings.tyfcbUpdatedAt ?? settings.tyfcbCheckedAt;
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function shouldRunMonthlyTyfcbSync(
  settings: Pick<ChapterSettings, "tyfcbUpdatedAt" | "tyfcbCheckedAt">,
  now = new Date(),
) {
  const reference = settings.tyfcbUpdatedAt ?? settings.tyfcbCheckedAt;
  if (!reference) return true;
  return (
    reference.getUTCFullYear() !== now.getUTCFullYear() ||
    reference.getUTCMonth() !== now.getUTCMonth()
  );
}

export function isTyfcbDisplayEnabled(
  settings: Pick<ChapterSettings, "tyfcbEnabled" | "tyfcbAmount">,
) {
  return settings.tyfcbEnabled !== false && getTyfcbAmount(settings) != null;
}
