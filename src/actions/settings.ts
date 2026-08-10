"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { chapterSettings, charityLinks } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import {
  settingsSchema,
  charityLinkSchema,
  type SettingsFormValues,
  type CharityLinkFormValues,
} from "@/lib/validations";
import { getChapterSettings } from "@/lib/settings";

export async function updateSettings(data: SettingsFormValues) {
  await requireAdmin();
  const parsed = settingsSchema.parse(data);
  const existing = await getChapterSettings();

  await db
    .update(chapterSettings)
    .set({
      ...parsed,
      presentationSlot: parsed.presentationSlot || null,
      educationSlot: parsed.educationSlot || null,
      trainingEvents: parsed.trainingEvents || null,
      charityParagraph: parsed.charityParagraph || null,
      charityLogoUrl: parsed.charityLogoUrl || null,
      bniDabbersBankDetails: parsed.bniDabbersBankDetails || null,
      bniGlobalBankDetails: parsed.bniGlobalBankDetails || null,
      chapterLogoUrl: parsed.chapterLogoUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(chapterSettings.id, existing.id));

  revalidatePath("/settings");
  revalidatePath("/exports");
  return { success: true };
}

export async function upsertCharityLink(
  data: CharityLinkFormValues & { id?: string },
) {
  await requireAdmin();
  const parsed = charityLinkSchema.parse(data);

  if (data.id) {
    await db
      .update(charityLinks)
      .set(parsed)
      .where(eq(charityLinks.id, data.id));
  } else {
    await db.insert(charityLinks).values(parsed);
  }

  revalidatePath("/settings");
  revalidatePath("/exports");
  return { success: true };
}

export async function deleteCharityLink(id: string) {
  await requireAdmin();
  await db.delete(charityLinks).where(eq(charityLinks.id, id));
  revalidatePath("/settings");
  revalidatePath("/exports");
  return { success: true };
}
