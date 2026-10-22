import { renderDirectoryMarkdown } from "@/lib/ai/render-markdown";
import { renderCmsPageMarkdown } from "@/lib/ai/render-markdown";
import { renderMemberMarkdown } from "@/lib/ai/render-markdown";
import { renderNetworkingHubMarkdown } from "@/lib/ai/render-markdown";
import { renderVisitMarkdown } from "@/lib/ai/render-markdown";
import { parseMarkdownRoute } from "@/lib/ai/markdown-paths";
import { buildFallbackHomePage } from "@/lib/marketing/fallback-home";
import { getActiveMembers, getMemberBySlug } from "@/lib/members";
import {
  getPublishedHomePage,
  getPublishedPageBySlug,
  listPublishedLocationPages,
  listPublishedPages,
} from "@/lib/pages";
import { getChapterSettings } from "@/lib/settings";

export async function resolveMarkdownDocument(pathSegments: string[] | undefined) {
  const parsed = parseMarkdownRoute(pathSegments);
  if (!parsed) return null;

  const settings = await getChapterSettings();

  switch (parsed.kind) {
    case "home": {
      const homePage = (await getPublishedHomePage()) ?? buildFallbackHomePage();
      return renderCmsPageMarkdown(homePage, settings, "/");
    }
    case "hub": {
      const locationPages = await listPublishedLocationPages();
      return renderNetworkingHubMarkdown(settings, locationPages);
    }
    case "directory": {
      const members = await getActiveMembers();
      return renderDirectoryMarkdown(settings, members);
    }
    case "visit": {
      return renderVisitMarkdown(settings);
    }
    case "location": {
      const page = await getPublishedPageBySlug(parsed.slug);
      if (!page || page.kind !== "location") return null;
      return renderCmsPageMarkdown(page, settings, `/networking-groups/${page.slug}`);
    }
    case "standard": {
      const page = await getPublishedPageBySlug(parsed.slug);
      if (!page || page.kind !== "standard") return null;
      return renderCmsPageMarkdown(page, settings, `/${page.slug}`);
    }
    case "article": {
      const page = await getPublishedPageBySlug(parsed.slug);
      if (!page || page.kind !== "article") return null;
      return renderCmsPageMarkdown(page, settings, `/insights/${page.slug}`);
    }
    case "tradesHub":
    case "openSeats":
    case "insightsHub":
    case "trade": {
      return null;
    }
    case "member": {
      const member = await getMemberBySlug(parsed.slug);
      if (!member || member.status !== "active") return null;
      return renderMemberMarkdown(member, settings);
    }
    default:
      return null;
  }
}

export async function listPublishedMarkdownSlugs() {
  const pages = await listPublishedPages();
  const members = await getActiveMembers();
  return { pages, members };
}
