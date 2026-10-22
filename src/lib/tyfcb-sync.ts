import { eq } from "drizzle-orm";
import { db } from "@/db";
import { chapterSettings } from "@/db/schema";
import { revalidateAiDiscovery } from "@/lib/ai/revalidate-discovery";
import { revalidatePath } from "next/cache";
import { getChapterSettings } from "@/lib/settings";
import {
  DEFAULT_TYFCB_SOURCE_URL,
  fetchTyfcbFromBni,
  isTyfcbSanityOk,
  shouldRunMonthlyTyfcbSync,
} from "@/lib/tyfcb";

function revalidateTyfcbSurfaces() {
  revalidatePath("/");
  revalidatePath("/visit");
  revalidatePath("/directory");
  revalidatePath("/networking-groups", "layout");
  revalidatePath("/trades");
  revalidatePath("/insights");
  revalidateAiDiscovery();
}

export async function syncTyfcbFromBni(options?: {
  force?: boolean;
  skipRevalidation?: boolean;
}) {
  const settings = await getChapterSettings();
  if (!settings.tyfcbEnabled && !options?.force) {
    return { success: true, skipped: true as const, reason: "disabled" };
  }

  if (!options?.force && !shouldRunMonthlyTyfcbSync(settings)) {
    return { success: true, skipped: true as const, reason: "already-synced-this-month" };
  }

  const sourceUrl = settings.tyfcbSourceUrl ?? DEFAULT_TYFCB_SOURCE_URL;

  try {
    const fetched = await fetchTyfcbFromBni(sourceUrl);
    const previous = settings.tyfcbAmount ? Number(settings.tyfcbAmount) : null;

    if (!isTyfcbSanityOk(previous, fetched.amount)) {
      return { success: false, error: "sanity-check-failed" };
    }

    const now = new Date();
    const changed = previous !== fetched.amount;

    await db
      .update(chapterSettings)
      .set({
        tyfcbAmount: String(fetched.amount),
        tyfcbCurrency: fetched.currency,
        tyfcbCheckedAt: now,
        ...(changed ? { tyfcbUpdatedAt: now } : {}),
        tyfcbSourceUrl: sourceUrl,
        updatedAt: now,
      })
      .where(eq(chapterSettings.id, settings.id));

    if (!options?.skipRevalidation) {
      revalidateTyfcbSurfaces();
    }
    return { success: true, changed, amount: fetched.amount };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "sync-failed",
    };
  }
}
