import type { ChapterSettings, Member, Page } from "@/db/schema";
import {
  applyChapterTokensToPage,
  formatMeetingSchedule,
  formatVenueLine,
} from "@/lib/chapter-tokens";
import { getMarkdownUrlForHtmlPath } from "@/lib/ai/markdown-paths";
import {
  getMemberDisplayName,
  getMemberProfilePath,
} from "@/lib/members";
import { getPagePublicPath } from "@/lib/pages";
import { absoluteUrl } from "@/lib/site-url";
import { isProfileFieldVisible } from "@/lib/profile-visibility";

function frontmatter(fields: Record<string, string>) {
  const lines = Object.entries(fields).map(([key, value]) => `${key}: "${value.replace(/"/g, '\\"')}"`);
  return `---\n${lines.join("\n")}\n---\n\n`;
}

function renderPageBody(page: Page) {
  const parts: string[] = [`# ${page.title}`, ""];

  if (page.intro.trim()) {
    parts.push(page.intro.trim(), "");
  }

  for (const section of page.sections) {
    parts.push(`## ${section.heading}`, "", section.body.trim(), "");
  }

  if (page.faqs.length > 0) {
    parts.push("## Frequently asked questions", "");
    for (const faq of page.faqs) {
      parts.push(`### ${faq.question}`, "", faq.answer.trim(), "");
    }
  }

  if (page.ctaHeading || page.ctaBody) {
    parts.push("## Next step", "");
    if (page.ctaHeading) parts.push(`### ${page.ctaHeading}`, "");
    if (page.ctaBody) parts.push(page.ctaBody.trim(), "");
    parts.push(`[Request a guest visit](${absoluteUrl("/visit")})`, "");
  }

  return parts.join("\n");
}

export function renderCmsPageMarkdown(
  page: Page,
  settings: ChapterSettings,
  htmlPath: string,
) {
  const hydrated = applyChapterTokensToPage(page, settings);
  const canonical = absoluteUrl(htmlPath);
  const markdownSelf = getMarkdownUrlForHtmlPath(htmlPath) ?? canonical;

  return (
    frontmatter({
      title: hydrated.metaTitle,
      description: hydrated.metaDescription,
      canonical,
      content_type: "marketing_page",
      location: hydrated.locationName ?? "Cheshire East",
      chapter: settings.chapterName,
      meeting_schedule: formatMeetingSchedule(settings),
      venue: formatVenueLine(settings),
    }) +
    renderPageBody(hydrated) +
    `\n---\n\n` +
    `- HTML version: ${canonical}\n` +
    `- Markdown version: ${markdownSelf}\n` +
    `- Member directory: ${absoluteUrl("/directory")}\n` +
    `- Guest visit form: ${absoluteUrl("/visit")}\n`
  );
}

export function renderNetworkingHubMarkdown(
  settings: ChapterSettings,
  locationPages: Page[],
) {
  const canonical = absoluteUrl("/networking-groups");
  const lines = [
    frontmatter({
      title: "Networking groups in Cheshire East | BNI Dabbers",
      description:
        "Guides to business networking groups near Nantwich, Crewe, Sandbach and Cheshire East.",
      canonical,
      content_type: "networking_hub",
      chapter: settings.chapterName,
      meeting_schedule: formatMeetingSchedule(settings),
      venue: formatVenueLine(settings),
    }),
    "# Networking groups near Nantwich, Crewe and Cheshire East",
    "",
    `${settings.chapterName} meets weekly at ${settings.venueName} (${settings.venueAddress}).`,
    "",
    "## Location guides",
    "",
  ];

  for (const page of locationPages) {
    const hydrated = applyChapterTokensToPage(page, settings);
    const htmlPath = getPagePublicPath(page);
    const mdUrl = getMarkdownUrlForHtmlPath(htmlPath);
    lines.push(
      `- [${hydrated.title}](${absoluteUrl(htmlPath)}) — ${hydrated.metaDescription}${mdUrl ? ` · [Markdown](${mdUrl})` : ""}`,
    );
  }

  lines.push(
    "",
    "## Visit as a guest",
    "",
    `Use the [guest visit form](${absoluteUrl("/visit")}) to attend a ${settings.meetingDay} morning meeting.`,
    "",
  );

  return lines.join("\n");
}

export function renderDirectoryMarkdown(
  settings: ChapterSettings,
  members: Member[],
) {
  const canonical = absoluteUrl("/directory");
  const lines = [
    frontmatter({
      title: "BNI Dabbers member directory",
      description:
        "Active BNI Dabbers members in Cheshire East — companies, trade categories and public profiles.",
      canonical,
      content_type: "member_directory",
      chapter: settings.chapterName,
      member_count: String(members.length),
    }),
    "# BNI Dabbers member directory",
    "",
    `${members.length} active members. Meeting ${formatMeetingSchedule(settings)} at ${formatVenueLine(settings)}.`,
    "",
    "## Members",
    "",
  ];

  for (const member of members) {
    const name = getMemberDisplayName(member);
    const profilePath = getMemberProfilePath(member);
    const mdUrl = getMarkdownUrlForHtmlPath(profilePath);
    lines.push(
      `- **${name}** — ${member.company} (${member.bniSeat}) · [Profile](${absoluteUrl(profilePath)})${mdUrl ? ` · [Markdown](${mdUrl})` : ""}`,
    );
  }

  lines.push("", `[Browse the interactive directory](${canonical})`, "");
  return lines.join("\n");
}

export function renderVisitMarkdown(settings: ChapterSettings) {
  const canonical = absoluteUrl("/visit");
  return [
    frontmatter({
      title: "Visit BNI Dabbers as a guest",
      description:
        "Request a guest visit to BNI Dabbers — referral-first business networking in Cheshire East.",
      canonical,
      content_type: "guest_visit",
      chapter: settings.chapterName,
      meeting_schedule: formatMeetingSchedule(settings),
      venue: formatVenueLine(settings),
      enquiry_email: process.env.ENQUIRY_TO_EMAIL ?? "ryan@smartastudio.com",
    }),
    "# Visit BNI Dabbers as a guest",
    "",
    `${settings.chapterName} welcomes guests at weekly ${settings.meetingDay} morning meetings.`,
    "",
    "## Meeting details",
    "",
    `- **When:** ${formatMeetingSchedule(settings)}`,
    `- **Where:** ${formatVenueLine(settings)}`,
    "",
    "## Request a visit",
    "",
    `Submit the [guest visit form](${canonical}) on the website. Enquiries are handled by the chapter team.`,
    "",
    "## Related pages",
    "",
    `- [Home](${absoluteUrl("/")})`,
    `- [Networking groups hub](${absoluteUrl("/networking-groups")})`,
    `- [Member directory](${absoluteUrl("/directory")})`,
    "",
  ].join("\n");
}

export function renderMemberMarkdown(
  member: Member,
  settings: ChapterSettings,
) {
  const profilePath = getMemberProfilePath(member);
  const canonical = absoluteUrl(profilePath);
  const visibility = member.profileVisibility ?? {};
  const name = getMemberDisplayName(member);

  const lines = [
    frontmatter({
      title: `${name} | BNI Dabbers member`,
      description: `${member.company} · ${member.bniSeat} · BNI Dabbers`,
      canonical,
      content_type: "member_profile",
      chapter: settings.chapterName,
      company: member.company,
      bni_seat: member.bniSeat,
    }),
    `# ${name}`,
    "",
    `- **Company:** ${member.company}`,
    `- **BNI seat / category:** ${member.bniSeat}`,
    `- **Chapter:** ${settings.chapterName}`,
    "",
  ];

  if (member.profilePublished && member.profileHeadline && isProfileFieldVisible(visibility, "headline")) {
    lines.push(`> ${member.profileHeadline}`, "");
  }

  if (member.profilePublished && member.profileSummary && isProfileFieldVisible(visibility, "summary")) {
    lines.push("## About", "", member.profileSummary.trim(), "");
  }

  if (
    member.profilePublished &&
    member.profileServices.length > 0 &&
    isProfileFieldVisible(visibility, "services")
  ) {
    lines.push("## Services", "");
    for (const service of member.profileServices) {
      lines.push(`- ${service}`);
    }
    lines.push("");
  }

  if (
    member.profilePublished &&
    member.profileIdealReferral &&
    isProfileFieldVisible(visibility, "idealReferral")
  ) {
    lines.push("## Ideal referral", "", member.profileIdealReferral.trim(), "");
  }

  lines.push("## Connect", "");
  if (isProfileFieldVisible(visibility, "website") && member.websiteUrl) {
    lines.push(`- Website: ${member.websiteUrl}`);
  }
  if (isProfileFieldVisible(visibility, "linkedin") && member.linkedinUrl) {
    lines.push(`- LinkedIn: ${member.linkedinUrl}`);
  }

  lines.push(
    "",
    `[View full profile](${canonical}) · [Member directory](${absoluteUrl("/directory")}) · [Visit the chapter](${absoluteUrl("/visit")})`,
    "",
  );

  return lines.join("\n");
}
