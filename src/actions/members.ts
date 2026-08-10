"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { memberSchema, type MemberFormValues } from "@/lib/validations";

function revalidateMemberPaths() {
  revalidatePath("/");
  revalidatePath("/members");
  revalidatePath("/exports");
}

export async function createMember(data: MemberFormValues) {
  await requireAdmin();
  const parsed = memberSchema.parse(data);

  await db.insert(members).values({
    ...parsed,
    linkedinUrl: parsed.linkedinUrl || null,
    websiteUrl: parsed.websiteUrl || null,
    chapterRole: parsed.chapterRole || null,
    notes: parsed.notes || null,
    headshotUrl: parsed.headshotUrl || null,
  });

  revalidateMemberPaths();
  return { success: true };
}

export async function updateMember(id: string, data: MemberFormValues) {
  await requireAdmin();
  const parsed = memberSchema.parse(data);

  await db
    .update(members)
    .set({
      ...parsed,
      linkedinUrl: parsed.linkedinUrl || null,
      websiteUrl: parsed.websiteUrl || null,
      chapterRole: parsed.chapterRole || null,
      notes: parsed.notes || null,
      headshotUrl: parsed.headshotUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(members.id, id));

  revalidateMemberPaths();
  return { success: true };
}

export async function deleteMember(id: string) {
  await requireAdmin();
  await db.delete(members).where(eq(members.id, id));
  revalidateMemberPaths();
  return { success: true };
}
