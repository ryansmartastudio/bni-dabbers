import type { MetadataRoute } from "next";
import { PUBLIC_MARKDOWN_ROUTES, getMarkdownPathForMember, getMarkdownPathForPage } from "@/lib/ai/markdown-paths";
import { getActiveMembers, getMemberProfilePath } from "@/lib/members";
import { getMarkdownPathForHtmlPath } from "@/lib/ai/markdown-paths";
import { getPagePublicPath, getPublishedHomePage, listPublishedPages } from "@/lib/pages";
import { getChapterSettings } from "@/lib/settings";
import { getSiteUrl } from "@/lib/site-url";
import { getTradeGroups } from "@/lib/trades";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [pages, members, homePage, settings, tradeGroups] = await Promise.all([
    listPublishedPages(),
    getActiveMembers(),
    getPublishedHomePage(),
    getChapterSettings(),
    getTradeGroups(),
  ]);

  const homeUpdated = homePage?.updatedAt ?? settings.updatedAt;

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: homeUpdated,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/networking-groups`,
      lastModified: homeUpdated,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/directory`,
      lastModified: homeUpdated,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/visit`,
      lastModified: homeUpdated,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/insights`,
      lastModified: homeUpdated,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${siteUrl}/trades`,
      lastModified: homeUpdated,
      changeFrequency: "weekly",
      priority: 0.78,
    },
    {
      url: `${siteUrl}/open-seats`,
      lastModified: homeUpdated,
      changeFrequency: "monthly",
      priority: 0.65,
    },
  ];

  const tradeRoutes: MetadataRoute.Sitemap = tradeGroups.map((group) => ({
    url: `${siteUrl}/trades/${group.slug}`,
    lastModified: homeUpdated,
    changeFrequency: "monthly" as const,
    priority: 0.72,
  }));

  const pageRoutes: MetadataRoute.Sitemap = pages
    .filter((page) => page.kind !== "home")
    .map((page) => ({
      url: `${siteUrl}${getPagePublicPath(page)}`,
      lastModified: page.updatedAt,
      changeFrequency: "monthly" as const,
      priority:
        page.kind === "location" ? 0.85 : page.kind === "article" ? 0.68 : 0.7,
    }));

  const memberRoutes: MetadataRoute.Sitemap = members
    .filter((member) => member.slug)
    .map((member) => ({
      url: `${siteUrl}${getMemberProfilePath(member)}`,
      lastModified: member.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  const markdownRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}${PUBLIC_MARKDOWN_ROUTES.home}`,
      lastModified: homeUpdated,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${siteUrl}${PUBLIC_MARKDOWN_ROUTES.networkingHub}`,
      lastModified: homeUpdated,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${siteUrl}${PUBLIC_MARKDOWN_ROUTES.directory}`,
      lastModified: homeUpdated,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}${PUBLIC_MARKDOWN_ROUTES.visit}`,
      lastModified: homeUpdated,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...pages
      .filter((page) => page.kind !== "home")
      .map((page) => ({
        url: `${siteUrl}${getMarkdownPathForPage(page)}`,
        lastModified: page.updatedAt,
        changeFrequency: "monthly" as const,
        priority: page.kind === "location" ? 0.72 : 0.65,
      })),
    {
      url: `${siteUrl}/md/trades.md`,
      lastModified: homeUpdated,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/md/open-seats.md`,
      lastModified: homeUpdated,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${siteUrl}/md/insights.md`,
      lastModified: homeUpdated,
      changeFrequency: "weekly",
      priority: 0.68,
    },
    ...tradeGroups.map((group) => ({
      url: `${siteUrl}${getMarkdownPathForHtmlPath(`/trades/${group.slug}`)}`,
      lastModified: homeUpdated,
      changeFrequency: "monthly" as const,
      priority: 0.68,
    })),
    ...members
      .filter((member) => member.slug)
      .map((member) => {
        const mdPath = getMarkdownPathForMember(member);
        if (!mdPath) return null;
        return {
          url: `${siteUrl}${mdPath}`,
          lastModified: member.updatedAt,
          changeFrequency: "monthly" as const,
          priority: 0.55,
        };
      })
      .filter(Boolean) as MetadataRoute.Sitemap,
  ];

  return [
    ...staticRoutes,
    ...tradeRoutes,
    ...pageRoutes,
    ...memberRoutes,
    ...markdownRoutes,
  ];
}
