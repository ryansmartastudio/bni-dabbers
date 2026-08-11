"use server";

import { requireAdmin } from "@/lib/auth";
import { generateMemberProfileDraft } from "@/lib/ai/member-profile";
import {
  researchCompanyWebsite,
  type MemberProfileDraft,
} from "@/lib/company-research";
import { getMemberById, normalizeWebsiteUrl } from "@/lib/members";

export type DraftMemberProfileResult =
  | {
      success: true;
      draft: MemberProfileDraft;
      sourceUrl: string;
      generatedAt: string;
    }
  | {
      success: false;
      message: string;
    };

export async function draftMemberProfile(
  memberId: string,
): Promise<DraftMemberProfileResult> {
  await requireAdmin();

  const member = await getMemberById(memberId);
  if (!member) {
    return { success: false, message: "Member not found." };
  }

  const websiteUrl = member.websiteUrl
    ? normalizeWebsiteUrl(member.websiteUrl)
    : "";

  const research = await researchCompanyWebsite(websiteUrl);
  if ("code" in research) {
    return { success: false, message: research.message };
  }

  try {
    const draft = await generateMemberProfileDraft(member, research);
    return {
      success: true,
      draft,
      sourceUrl: research.url,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Profile generation failed. Try again or write the copy manually.",
    };
  }
}
