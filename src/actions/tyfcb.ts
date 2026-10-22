"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { chapterSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getChapterSettings } from "@/lib/settings";
import { DEFAULT_TYFCB_SOURCE_URL } from "@/lib/tyfcb";
import { syncTyfcbFromBni } from "@/lib/tyfcb-sync";

export async function refreshTyfcbFromBni(options?: { force?: boolean }) {
  await requireAdmin();
  return syncTyfcbFromBni({ force: options?.force ?? true });
}

export async function saveTyfcbSettings(values: {
  tyfcbEnabled: boolean;
  tyfcbSourceUrl: string;
  tyfcbAmountManual?: string;
}) {
  await requireAdmin();
  const settings = await getChapterSettings();
  const now = new Date();

  const patch: Partial<typeof chapterSettings.$inferInsert> = {
    tyfcbEnabled: values.tyfcbEnabled,
    tyfcbSourceUrl: values.tyfcbSourceUrl.trim() || DEFAULT_TYFCB_SOURCE_URL,
    tyfcbCheckedAt: now,
    updatedAt: now,
  };

  if (values.tyfcbAmountManual?.trim()) {
    const manual = Number.parseInt(values.tyfcbAmountManual.replace(/,/g, ""), 10);
    if (!Number.isFinite(manual) || manual <= 0) {
      return { success: false, error: "Invalid manual amount" };
    }
    patch.tyfcbAmount = String(manual);
    patch.tyfcbUpdatedAt = now;
  }

  await db.update(chapterSettings).set(patch).where(eq(chapterSettings.id, settings.id));

  const { revalidatePath } = await import("next/cache");
  const { revalidateAiDiscovery } = await import("@/lib/ai/revalidate-discovery");
  revalidatePath("/");
  revalidatePath("/visit");
  revalidateAiDiscovery();

  return { success: true };
}
