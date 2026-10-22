import type { Member, Page } from "@/db/schema";
import { getMemberProfilePath } from "@/lib/members";
import { getPagePublicPath } from "@/lib/pages";
import { absoluteUrl } from "@/lib/site-url";

export const PUBLIC_MARKDOWN_ROUTES = {
  home: "/md/index.md",
  networkingHub: "/md/networking-groups.md",
  directory: "/md/directory.md",
  visit: "/md/visit.md",
} as const;

export function getMarkdownPathForHtmlPath(htmlPath: string) {
  if (htmlPath === "/") return PUBLIC_MARKDOWN_ROUTES.home;
  if (htmlPath === "/networking-groups") return PUBLIC_MARKDOWN_ROUTES.networkingHub;
  if (htmlPath === "/directory") return PUBLIC_MARKDOWN_ROUTES.directory;
  if (htmlPath === "/visit") return PUBLIC_MARKDOWN_ROUTES.visit;
  if (htmlPath === "/trades") return "/md/trades.md";
  if (htmlPath === "/open-seats") return "/md/open-seats.md";
  if (htmlPath === "/insights") return "/md/insights.md";
  if (htmlPath.startsWith("/networking-groups/")) {
    return `/md${htmlPath}.md`;
  }
  if (htmlPath.startsWith("/directory/")) {
    return `/md${htmlPath}.md`;
  }
  if (htmlPath.startsWith("/trades/")) {
    return `/md${htmlPath}.md`;
  }
  if (htmlPath.startsWith("/insights/")) {
    return `/md${htmlPath}.md`;
  }
  if (htmlPath.startsWith("/") && htmlPath.length > 1 && !htmlPath.includes("/", 1)) {
    return `/md${htmlPath}.md`;
  }
  return null;
}

export function getMarkdownUrlForHtmlPath(htmlPath: string) {
  const mdPath = getMarkdownPathForHtmlPath(htmlPath);
  return mdPath ? absoluteUrl(mdPath) : null;
}

export function getMarkdownPathForPage(page: Pick<Page, "kind" | "slug">) {
  return getMarkdownPathForHtmlPath(getPagePublicPath(page)) ?? PUBLIC_MARKDOWN_ROUTES.home;
}

export function getMarkdownPathForMember(member: Pick<Member, "id" | "slug">) {
  return getMarkdownPathForHtmlPath(getMemberProfilePath(member)) ?? null;
}

export function parseMarkdownRoute(pathSegments: string[] | undefined) {
  if (!pathSegments?.length) return null;

  const joined = pathSegments.join("/");
  const normalized = joined.endsWith(".md") ? joined : `${joined}.md`;

  if (normalized === "index.md") return { kind: "home" as const };
  if (normalized === "networking-groups.md") return { kind: "hub" as const };
  if (normalized === "directory.md") return { kind: "directory" as const };
  if (normalized === "visit.md") return { kind: "visit" as const };
  if (normalized === "trades.md") return { kind: "tradesHub" as const };
  if (normalized === "open-seats.md") return { kind: "openSeats" as const };
  if (normalized === "insights.md") return { kind: "insightsHub" as const };

  const locationMatch = normalized.match(/^networking-groups\/([a-z0-9-]+)\.md$/);
  if (locationMatch) {
    return { kind: "location" as const, slug: locationMatch[1] };
  }

  const memberMatch = normalized.match(/^directory\/([a-z0-9-]+)\.md$/);
  if (memberMatch) {
    return { kind: "member" as const, slug: memberMatch[1] };
  }

  const tradeMatch = normalized.match(/^trades\/([a-z0-9-]+)\.md$/);
  if (tradeMatch) {
    return { kind: "trade" as const, slug: tradeMatch[1] };
  }

  const articleMatch = normalized.match(/^insights\/([a-z0-9-]+)\.md$/);
  if (articleMatch) {
    return { kind: "article" as const, slug: articleMatch[1] };
  }

  const standardMatch = normalized.match(/^([a-z0-9-]+)\.md$/);
  if (standardMatch) {
    return { kind: "standard" as const, slug: standardMatch[1] };
  }

  return null;
}
