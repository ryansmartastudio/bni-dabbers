import type { ChapterSettings, Page } from "@/db/schema";
import {
  formatTyfcbExact,
  formatTyfcbHeadline,
  formatTyfcbVerifiedMonth,
} from "@/lib/tyfcb";

export type ChapterTokenSettings = Pick<
  ChapterSettings,
  | "chapterName"
  | "meetingDay"
  | "meetingStart"
  | "meetingEnd"
  | "venueName"
  | "venueAddress"
  | "tyfcbAmount"
  | "tyfcbCurrency"
  | "tyfcbCheckedAt"
  | "tyfcbUpdatedAt"
>;

export function formatMeetingTimeRange(
  settings: Pick<ChapterSettings, "meetingStart" | "meetingEnd">,
) {
  return `${settings.meetingStart} to ${settings.meetingEnd}`;
}

export function formatMeetingTimeRangeEnDash(
  settings: Pick<ChapterSettings, "meetingStart" | "meetingEnd">,
) {
  return `${settings.meetingStart}–${settings.meetingEnd}`;
}

export function formatMeetingSchedule(settings: ChapterTokenSettings) {
  return `${settings.meetingDay}s · ${settings.meetingStart}–${settings.meetingEnd}`;
}

export function formatVenueLine(settings: Pick<ChapterSettings, "venueName" | "venueAddress">) {
  return `${settings.venueName}, ${settings.venueAddress}`;
}

export function buildMeetingFactsMarkdown(settings: ChapterTokenSettings) {
  return `We meet every **${settings.meetingDay}** from **${formatMeetingTimeRange(settings)}** at **${settings.venueName}**, ${settings.venueAddress} — a short drive from Nantwich, Sandbach and much of Cheshire East.`;
}

function buildTokenMap(settings: ChapterTokenSettings) {
  return {
    "{{chapterName}}": settings.chapterName,
    "{{meetingDay}}": settings.meetingDay,
    "{{meetingStart}}": settings.meetingStart,
    "{{meetingEnd}}": settings.meetingEnd,
    "{{meetingTimeRange}}": formatMeetingTimeRange(settings),
    "{{meetingTimeRangeEnDash}}": formatMeetingTimeRangeEnDash(settings),
    "{{venueName}}": settings.venueName,
    "{{venueAddress}}": settings.venueAddress,
    "{{meetingSchedule}}": formatMeetingSchedule(settings),
    "{{venueLine}}": formatVenueLine(settings),
    "{{meetingFacts}}": buildMeetingFactsMarkdown(settings),
    "{{tyfcb}}": formatTyfcbExact(settings),
    "{{tyfcbHeadline}}": formatTyfcbHeadline(settings),
    "{{tyfcbVerified}}": formatTyfcbVerifiedMonth(settings),
  } as const;
}

export function replaceChapterTokens(
  text: string,
  settings: ChapterTokenSettings,
): string {
  if (!text) return text;

  let result = text;
  for (const [token, value] of Object.entries(buildTokenMap(settings))) {
    result = result.split(token).join(value);
  }

  return result;
}

export function applyChapterTokensToPage(
  page: Page,
  settings: ChapterTokenSettings,
): Page {
  return {
    ...page,
    title: replaceChapterTokens(page.title, settings),
    metaTitle: replaceChapterTokens(page.metaTitle, settings),
    metaDescription: replaceChapterTokens(page.metaDescription, settings),
    heroEyebrow: page.heroEyebrow
      ? replaceChapterTokens(page.heroEyebrow, settings)
      : page.heroEyebrow,
    intro: replaceChapterTokens(page.intro, settings),
    excerpt: page.excerpt ? replaceChapterTokens(page.excerpt, settings) : page.excerpt,
    ctaHeading: page.ctaHeading
      ? replaceChapterTokens(page.ctaHeading, settings)
      : page.ctaHeading,
    ctaBody: page.ctaBody ? replaceChapterTokens(page.ctaBody, settings) : page.ctaBody,
    sections: page.sections.map((section) => ({
      ...section,
      heading: replaceChapterTokens(section.heading, settings),
      body: replaceChapterTokens(section.body, settings),
    })),
    faqs: page.faqs.map((faq) => ({
      question: replaceChapterTokens(faq.question, settings),
      answer: replaceChapterTokens(faq.answer, settings),
    })),
  };
}
