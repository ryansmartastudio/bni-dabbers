import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import {
  memberProfileDraftSchema,
  type CompanyResearchResult,
  type MemberProfileDraft,
} from "@/lib/company-research";
import type { Member } from "@/db/schema";
import { getMemberDisplayName } from "@/lib/members";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateMemberProfileDraft(
  member: Member,
  research: CompanyResearchResult,
): Promise<MemberProfileDraft> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to .env.local and redeploy.",
    );
  }

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: memberProfileDraftSchema,
    prompt: `You write public member profiles for a BNI networking chapter directory in the UK.

Write in UK English, third person, professional and plain. Use only facts supported by the website text below. Do not invent clients, awards, prices, locations, or services not mentioned. Avoid superlatives like "leading" or "best".

Member:
- Name: ${getMemberDisplayName(member)}
- Company: ${member.company}
- BNI seat (trade category): ${member.bniSeat}
${member.chapterRoles.length ? `- Chapter roles: ${member.chapterRoles.join(", ")}` : ""}

Website URL: ${research.url}
Page title: ${research.title || "Unknown"}
Meta description: ${research.description || "None"}

Website text:
"""
${research.text}
"""

Return:
- headline: one concise line for the profile hero (max ~90 characters)
- summary: 2-3 short paragraphs about what the company does and who it serves
- services: 3-6 specific services or specialisms mentioned on the site
- idealReferral: one paragraph describing the kind of referral a BNI member should send, grounded in the site content`,
  });

  return object;
}
