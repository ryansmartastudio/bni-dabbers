"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { members } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { removeClerkAccessForMember } from "@/lib/clerk-members";
import { requireMemberAccess } from "@/lib/member-access";
import {
  buildUniqueMemberSlug,
  getMemberProfilePath,
} from "@/lib/members";
import { memberSchema, type MemberFormValues } from "@/lib/validations";
import {
  memberProfileSchema,
  type MemberProfileFormValues,
} from "@/lib/member-profile";
import {
  revalidateAiDiscovery,
  revalidateMarkdownForMember,
} from "@/lib/ai/revalidate-discovery";
import { resolveProfileVisibility } from "@/lib/profile-visibility";
import { profileVisibilitySchema } from "@/lib/validations";

export type { MemberProfileFormValues };

function revalidateMemberPaths(member?: { id: string; slug: string | null }) {
  revalidatePath("/");
  revalidatePath("/members");
  revalidatePath("/exports");
  if (member) {
    revalidatePath(getMemberProfilePath(member));
    revalidateMarkdownForMember(member);
  } else {
    revalidateAiDiscovery();
  }
}

function normalizeProfileFields(parsed: {
  profileHeadline?: string | null;
  profileSummary?: string | null;
  profileServices?: string[];
  profileIdealReferral?: string | null;
  profileSourceUrl?: string | null;
  profileGeneratedAt?: string | null;
  profilePublished?: boolean;
  profileVisibility?: z.infer<typeof profileVisibilitySchema>;
}) {
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
    profileVisibility: resolveProfileVisibility(parsed.profileVisibility),
  };
}

type MemberSaveResult = { success: true } | { success: false; error: string };

function parseMemberForm(data: MemberFormValues) {
  const result = memberSchema.safeParse(data);
  if (result.success) return { parsed: result.data, error: null };
  const issue = result.error.issues[0];
  const field = issue?.path.join(".");
  return {
    parsed: null,
    error: field ? `${field}: ${issue.message}` : (issue?.message ?? "Invalid form data"),
  };
}

function getMemberWriteError(error: unknown): string | null {
  let current: unknown = error;
  while (current && typeof current === "object") {
    const { code, constraint } = current as { code?: string; constraint?: string };
    if (code === "23505") {
      return constraint?.includes("slug")
        ? "That public profile slug is already used by another member. Choose a different one or leave it blank."
        : "A member with these details already exists.";
    }
    current = (current as { cause?: unknown }).cause;
  }
  return null;
}

export async function createMember(data: MemberFormValues): Promise<MemberSaveResult> {
  await requireAdmin();
  const { parsed, error } = parseMemberForm(data);
  if (!parsed) return { success: false, error };
  const slug =
    parsed.slug?.trim() ||
    (await buildUniqueMemberSlug({
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      company: parsed.company,
    }));

  let created: { id: string; slug: string | null };
  try {
    [created] = await db
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
  } catch (writeError) {
    const message = getMemberWriteError(writeError);
    if (message) return { success: false, error: message };
    throw writeError;
  }

  revalidateMemberPaths(created);
  return { success: true };
}

export async function updateMember(
  id: string,
  data: MemberFormValues,
): Promise<MemberSaveResult> {
  await requireAdmin();
  const { parsed, error } = parseMemberForm(data);
  if (!parsed) return { success: false, error };
  const existing = await db.query.members.findFirst({
    where: eq(members.id, id),
  });
  if (!existing) {
    return { success: false, error: "Member not found" };
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

  try {
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
  } catch (writeError) {
    const message = getMemberWriteError(writeError);
    if (message) return { success: false, error: message };
    throw writeError;
  }

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

  if (!existing) {
    throw new Error("Member not found");
  }

  try {
    await removeClerkAccessForMember(existing);
  } catch (error) {
    throw new Error(
      `Could not remove Clerk access: ${error instanceof Error ? error.message : "Request failed."}`,
    );
  }

  await db.delete(members).where(eq(members.id, id));
  revalidateMemberPaths(existing);
  revalidatePath("/my-profile");
  return { success: true };
}

export async function saveMemberProfile(
  id: string,
  data: MemberProfileFormValues,
) {
  await requireMemberAccess(id);
  const parsed = memberProfileSchema.parse(data);
  const existing = await db.query.members.findFirst({
    where: eq(members.id, id),
  });
  if (!existing) {
    throw new Error("Member not found");
  }

  await db
    .update(members)
    .set({
      ...normalizeProfileFields(parsed),
      updatedAt: new Date(),
    })
    .where(eq(members.id, id));

  revalidateMemberPaths({ id, slug: existing.slug });
  return { success: true, published: parsed.profilePublished };
}
