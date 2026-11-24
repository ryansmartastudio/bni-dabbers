"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { crmVisitors } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getDefaultChapterId } from "@/lib/chapters";
import {
  addTimelineEntry,
  archiveVisitor,
  claimVisitor,
  deleteVisitor,
  findPossibleDuplicates,
  isCrmStage,
  promoteWorkshopSession,
  releaseVisitor,
  restoreVisitor,
  setStage,
  updateVisitorDetails,
  type DuplicateMatch,
  type PromotionSummary,
  type VisitorEdits,
} from "@/lib/crm/visitors";
import {
  planImport,
  runImport,
  type ImportOutcome,
  type ImportPlan,
} from "@/lib/crm/import";
import {
  sendWelcomeEmails,
  type WelcomeSendResult,
} from "@/lib/crm/welcome";
import { requireChapterAdmin, requireChapterMember } from "@/lib/member-access";
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

/**
 * Archiving is open to any member, like notes and details.
 *
 * It is reversible and it leaves the timeline intact, so the cost of a wrong
 * archive is one click to put it back. Making it admin-only would mean a
 * board full of people nobody can tidy away until Ryan is at a computer.
 */
export async function archiveForChapter(
  visitorId: string,
  reason?: string,
): Promise<Result<null>> {
  try {
    const { chapterId, memberId, memberName } = await acting();
    const result = await archiveVisitor(
      chapterId,
      visitorId,
      memberId,
      memberName,
      reason,
    );
    if (!result.ok) return result;

    revalidatePath("/crm");
    revalidatePath("/crm/archive");
    revalidatePath(`/crm/visitor/${visitorId}`);
    return { ok: true, data: null };
  } catch (error) {
    return fail(error);
  }
}

export async function restoreToChapter(
  visitorId: string,
): Promise<Result<null>> {
  try {
    const { chapterId, memberId, memberName } = await acting();
    const result = await restoreVisitor(chapterId, visitorId, memberId, memberName);
    if (!result.ok) return result;

    revalidatePath("/crm");
    revalidatePath("/crm/archive");
    revalidatePath(`/crm/visitor/${visitorId}`);
    return { ok: true, data: null };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Permanent, and admin-only.
 *
 * Unlike every other action here this one destroys the timeline as well as
 * the person, so it is gated on the role rather than on membership. The
 * confirmation the UI asks for is not the safeguard -- this is.
 */
export async function deleteForever(
  visitorId: string,
): Promise<Result<{ name: string }>> {
  try {
    const { member } = await requireChapterAdmin();
    const result = await deleteVisitor(member.chapterId, visitorId);
    if (!result.ok) return result;

    revalidatePath("/crm");
    revalidatePath("/crm/archive");
    return { ok: true, data: { name: result.data.name } };
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

/**
 * Correct a visitor's details. Open to any member of the chapter, like
 * notes and unlike the stage, with every change recorded on the timeline.
 */
export async function editVisitor(
  visitorId: string,
  edits: VisitorEdits,
): Promise<Result<null>> {
  try {
    const { chapterId, memberId, memberName } = await acting();
    const result = await updateVisitorDetails(
      chapterId,
      visitorId,
      memberId,
      memberName,
      edits,
    );
    if (!result.ok) return result;

    revalidatePath("/crm");
    revalidatePath(`/crm/visitor/${visitorId}`);
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
 * What a spreadsheet would do, without doing any of it.
 *
 * Open to any member, like adding one by hand. It writes nothing, so the
 * worst a mistake here costs is a second look at the preview.
 */
export async function previewImport(text: string): Promise<Result<ImportPlan>> {
  try {
    const { chapterId } = await acting();
    const result = await planImport(chapterId, text);
    if (!result.ok) return result;
    return { ok: true, data: result.data };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Commit the import.
 *
 * Takes the file text again rather than the previewed rows. The preview is a
 * description of what would happen, not the instruction -- re-planning
 * server-side means an edited payload cannot write rows the member never saw.
 */
export async function confirmImport(
  text: string,
  skipDuplicates: boolean,
): Promise<Result<ImportOutcome>> {
  try {
    const { chapterId, memberId, memberName } = await acting();
    const result = await runImport(chapterId, memberId, memberName, text, {
      skipDuplicates,
    });
    if (!result.ok) return result;

    revalidatePath("/crm");
    return { ok: true, data: result.data };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Email members to tell them the CRM is open.
 *
 * Admin only and outward-facing: this puts a message in other people's
 * inboxes under the chapter's name. The ids come from the screen the admin
 * was looking at, so the number they confirmed is the number that is sent.
 */
export async function sendWelcomeTo(
  memberIds: string[],
): Promise<Result<WelcomeSendResult>> {
  try {
    const { member } = await requireChapterAdmin();
    const result = await sendWelcomeEmails(member.chapterId, memberIds);
    if (!result.ok) return result;

    revalidatePath("/crm/members");
    return { ok: true, data: result.data };
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
