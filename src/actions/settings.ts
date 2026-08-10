"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { chapterSettings, charityLinks } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import {
  saveAllSettingsSchema,
  type SaveAllSettingsValues,
} from "@/lib/validations";
import { getChapterSettings, getCharityLinks } from "@/lib/settings";

export async function saveAllSettings(data: SaveAllSettingsValues) {
  await requireAdmin();
  const parsed = saveAllSettingsSchema.parse(data);
  const existing = await getChapterSettings();

  await db
    .update(chapterSettings)
    .set({
      ...parsed.settings,
      presentationSlot: parsed.settings.presentationSlot || null,
      educationSlot: parsed.settings.educationSlot || null,
      trainingEvents: parsed.settings.trainingEvents || null,
      charityParagraph: parsed.settings.charityParagraph || null,
      charityLogoUrl: parsed.settings.charityLogoUrl || null,
      bniDabbersBankDetails: parsed.settings.bniDabbersBankDetails || null,
      bniGlobalBankDetails: parsed.settings.bniGlobalBankDetails || null,
      chapterLogoUrl: parsed.settings.chapterLogoUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(chapterSettings.id, existing.id));

  const existingLinks = await getCharityLinks();
  const submittedIds = parsed.charityLinks
    .map((link) => link.id)
    .filter((id): id is string => Boolean(id));

  const idsToDelete = existingLinks
    .map((link) => link.id)
    .filter((id) => !submittedIds.includes(id));

  if (idsToDelete.length > 0) {
    await db.delete(charityLinks).where(inArray(charityLinks.id, idsToDelete));
  }

  for (const link of parsed.charityLinks) {
    const values = {
      label: link.label,
      url: link.url,
      sortOrder: link.sortOrder,
    };

    if (link.id) {
      await db
        .update(charityLinks)
        .set(values)
        .where(eq(charityLinks.id, link.id));
    } else {
      await db.insert(charityLinks).values(values);
    }
  }

  revalidatePath("/settings");
  revalidatePath("/exports");
  return { success: true };
}
