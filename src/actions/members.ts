"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import {
  buildUniqueMemberSlug,
  getMemberProfilePath,
} from "@/lib/members";
import { memberSchema, type MemberFormValues } from "@/lib/validations";

function revalidateMemberPaths(member?: { id: string; slug: string | null }) {
  revalidatePath("/");
  revalidatePath("/members");
  revalidatePath("/exports");
  if (member) {
    revalidatePath(getMemberProfilePath(member));
  }
}

function normalizeProfileFields(parsed: MemberFormValues) {
  return {
    profileHeadline: parsed.profileHeadline?.trim() || null,
    profileSummary: parsed.profileSummary?.trim() || null,
    profileServices: parsed.profileServices ?? [],
    profileIdealReferral: parsed.profileIdealReferral?.trim() || null,
    profileSourceUrl: parsed.profileSourceUrl?.trim() || null,
    profileGeneratedAt: parsed.profileGeneratedAt
      ? new Date(parsed.profileGeneratedAt)
      : null,
    profilePublished: parsed.profilePublished ?? false,
  };
}

export async function createMember(data: MemberFormValues) {
  await requireAdmin();
  const parsed = memberSchema.parse(data);
  const slug =
    parsed.slug?.trim() ||
    (await buildUniqueMemberSlug({
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      company: parsed.company,
    }));

  const [created] = await db
    .insert(members)
    .values({
      ...parsed,
      slug,
      linkedinUrl: parsed.linkedinUrl || null,
      websiteUrl: parsed.websiteUrl || null,
      chapterRoles: parsed.chapterRoles,
      notes: parsed.notes || null,
      headshotUrl: parsed.headshotUrl || null,
      ...normalizeProfileFields(parsed),
    })
    .returning({ id: members.id, slug: members.slug });

  revalidateMemberPaths(created);
  return { success: true };
}

export async function updateMember(id: string, data: MemberFormValues) {
  await requireAdmin();
  const parsed = memberSchema.parse(data);
  const existing = await db.query.members.findFirst({
    where: eq(members.id, id),
  });
  if (!existing) {
    throw new Error("Member not found");
  }

  const slug =
    parsed.slug?.trim() ||
    existing.slug ||
    (await buildUniqueMemberSlug(
      {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        company: parsed.company,
      },
      id,
    ));

  await db
    .update(members)
    .set({
      ...parsed,
      slug,
      linkedinUrl: parsed.linkedinUrl || null,
      websiteUrl: parsed.websiteUrl || null,
      chapterRoles: parsed.chapterRoles,
      notes: parsed.notes || null,
      headshotUrl: parsed.headshotUrl || null,
      ...normalizeProfileFields(parsed),
      updatedAt: new Date(),
    })
    .where(eq(members.id, id));

  revalidateMemberPaths({ id, slug });
  if (existing.slug && existing.slug !== slug) {
    revalidatePath(getMemberProfilePath(existing));
  }
  return { success: true };
}

export async function deleteMember(id: string) {
  await requireAdmin();
  const existing = await db.query.members.findFirst({
    where: eq(members.id, id),
  });
  await db.delete(members).where(eq(members.id, id));
  revalidateMemberPaths(existing ?? undefined);
  return { success: true };
}
