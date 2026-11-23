"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { crmVisitors } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getDefaultChapterId } from "@/lib/chapters";
import {
  addTimelineEntry,
  claimVisitor,
  findPossibleDuplicates,
  isCrmStage,
  promoteWorkshopSession,
  releaseVisitor,
  setStage,
  type DuplicateMatch,
  type PromotionSummary,
} from "@/lib/crm/visitors";
import { requireChapterMember } from "@/lib/member-access";
import { emailKey, normaliseText, phoneKey } from "@/lib/workshop/normalise";

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Every action resolves the chapter from the signed-in member rather than
 * taking it as an argument. A chapter id in a request body would be a request
 * to read someone else's data.
 */
async function acting() {
  const { member } = await requireChapterMember();
  return {
    chapterId: member.chapterId,
    memberId: member.id,
    memberName: `${member.firstName} ${member.lastName}`.trim(),
  };
}

/**
 * Next signals redirect() and notFound() by throwing, so a blanket catch
 * turns an expired session into "something went wrong" rather than a trip to
 * the sign-in page. Those two are rethrown; everything else is a real fault.
 */
function isControlFlow(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false;
  }
  const digest = (error as { digest?: unknown }).digest;
  return (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND")
  );
}

function fail(error: unknown): { ok: false; error: string } {
  if (isControlFlow(error)) throw error;
  console.error("CRM action failed", error);
  return { ok: false, error: "Something went wrong. Try again." };
}

export async function moveVisitor(
  visitorId: string,
  stage: string,
): Promise<Result<null>> {
  try {
    if (!isCrmStage(stage)) return { ok: false, error: "That isn't a stage." };
    const { chapterId, memberId } = await acting();
    const result = await setStage(chapterId, visitorId, memberId, stage);
    if (!result.ok) return result;

    revalidatePath("/crm");
    revalidatePath(`/crm/visitor/${visitorId}`);
    return { ok: true, data: null };
  } catch (error) {
    return fail(error);
  }
}

export async function claimForMe(visitorId: string): Promise<Result<null>> {
  try {
    const { chapterId, memberId, memberName } = await acting();
    const result = await claimVisitor(chapterId, visitorId, memberId, memberName);
    if (!result.ok) return result;

    revalidatePath("/crm");
    revalidatePath(`/crm/visitor/${visitorId}`);
    return { ok: true, data: null };
  } catch (error) {
    return fail(error);
  }
}

export async function releaseMine(visitorId: string): Promise<Result<null>> {
  try {
    const { chapterId, memberId, memberName } = await acting();
    const result = await releaseVisitor(chapterId, visitorId, memberId, memberName);
    if (!result.ok) return result;

    revalidatePath("/crm");
    revalidatePath(`/crm/visitor/${visitorId}`);
    return { ok: true, data: null };
  } catch (error) {
    return fail(error);
  }
}

/** Notes are open to any member of the chapter, unlike the stage. */
export async function addNote(
  visitorId: string,
  body: string,
): Promise<Result<null>> {
  try {
    const trimmed = body.replace(/\s+/g, " ").trim().slice(0, 2000);
    if (!trimmed) return { ok: false, error: "Write something first." };

    const { chapterId, memberId } = await acting();

    // Scoped check: without it, a visitor id from another chapter would get a
    // note attached to it.
    const owned = await db.query.crmVisitors.findFirst({
      where: (visitor, { and, eq }) =>
        and(eq(visitor.id, visitorId), eq(visitor.chapterId, chapterId)),
    });
    if (!owned) return { ok: false, error: "That visitor is no longer on the list." };

    await addTimelineEntry({
      chapterId,
      visitorId,
      authorMemberId: memberId,
      kind: "note",
      body: trimmed,
    });

    revalidatePath(`/crm/visitor/${visitorId}`);
    revalidatePath("/crm");
    return { ok: true, data: null };
  } catch (error) {
    return fail(error);
  }
}

export type NewVisitorInput = {
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  category?: string;
  claimForMe?: boolean;
};

export async function checkForDuplicates(
  input: NewVisitorInput,
): Promise<Result<DuplicateMatch[]>> {
  try {
    const { chapterId } = await acting();
    const matches = await findPossibleDuplicates(chapterId, {
      name: input.name,
      company: input.company,
      phone: input.phone,
      email: input.email,
    });
    return { ok: true, data: matches };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Add somebody who did not come out of a workshop.
 *
 * Duplicates are a warning shown before this is called, never a refusal here:
 * two people really can share a name.
 */
export async function addVisitor(
  input: NewVisitorInput,
): Promise<Result<{ id: string }>> {
  try {
    const name = input.name.replace(/\s+/g, " ").trim().slice(0, 120);
    if (!name) return { ok: false, error: "A name is needed." };

    const { chapterId, memberId, memberName } = await acting();
    const company = input.company?.trim().slice(0, 80) || null;
    const phone = input.phone?.trim().slice(0, 40) || null;
    const email = input.email?.trim().slice(0, 120) || null;
    const now = new Date();

    const [created] = await db
      .insert(crmVisitors)
      .values({
        chapterId,
        name,
        company,
        phone,
        email,
        category: input.category?.trim().slice(0, 80) || null,
        addedByMemberId: memberId,
        ownerMemberId: input.claimForMe ? memberId : null,
        ownerClaimedAt: input.claimForMe ? now : null,
        nameKey: normaliseText(name),
        companyKey: normaliseText(company ?? ""),
        phoneKey: phoneKey(phone),
        emailKey: emailKey(email),
      })
      .returning({ id: crmVisitors.id });

    if (!created) return { ok: false, error: "Couldn't add them. Try again." };

    await addTimelineEntry({
      chapterId,
      visitorId: created.id,
      authorMemberId: memberId,
      kind: "system",
      body: `${memberName} added this one by hand`,
    });

    if (input.claimForMe) {
      await addTimelineEntry({
        chapterId,
        visitorId: created.id,
        authorMemberId: memberId,
        kind: "claim",
        body: `${memberName} took this one on`,
      });
    }

    revalidatePath("/crm");
    return { ok: true, data: { id: created.id } };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Copy a workshop's contacts into the pipeline. Admin only, because it is a
 * chapter-wide action rather than one member's.
 */
export async function promoteSession(
  sessionId: string,
): Promise<Result<PromotionSummary>> {
  try {
    await requireAdmin();
    const chapterId = await getDefaultChapterId();
    const summary = await promoteWorkshopSession(chapterId, sessionId);

    revalidatePath("/crm");
    return { ok: true, data: summary };
  } catch (error) {
    return fail(error);
  }
}
