import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { pages, type Page } from "@/db/schema";

export async function listAllPages() {
  return db.query.pages.findMany({
    orderBy: [asc(pages.sortOrder), desc(pages.updatedAt)],
  });
}

export async function listPublishedPages() {
  return db.query.pages.findMany({
    where: eq(pages.published, true),
    orderBy: [asc(pages.sortOrder), asc(pages.title)],
  });
}

export async function listPublishedLocationPages() {
  return db.query.pages.findMany({
    where: and(eq(pages.published, true), eq(pages.kind, "location")),
    orderBy: [asc(pages.sortOrder), asc(pages.title)],
  });
}

export async function listPublishedStandardPages() {
  return db.query.pages.findMany({
    where: and(eq(pages.published, true), eq(pages.kind, "standard")),
    orderBy: [asc(pages.sortOrder), asc(pages.title)],
  });
}

export async function listPublishedArticlePages() {
  return db.query.pages.findMany({
    where: and(eq(pages.published, true), eq(pages.kind, "article")),
    orderBy: [desc(pages.publishedAt), desc(pages.updatedAt)],
  });
}

export async function getPageById(id: string) {
  return db.query.pages.findFirst({
    where: eq(pages.id, id),
  });
}

export async function getPageBySlug(slug: string) {
  return db.query.pages.findFirst({
    where: eq(pages.slug, slug),
  });
}

export async function getPublishedPageBySlug(slug: string) {
  return db.query.pages.findFirst({
    where: and(eq(pages.slug, slug), eq(pages.published, true)),
  });
}

export async function getPublishedHomePage() {
  return db.query.pages.findFirst({
    where: and(eq(pages.kind, "home"), eq(pages.published, true)),
  });
}

export function getPagePublicPath(page: Pick<Page, "kind" | "slug">) {
  if (page.kind === "home") {
    return "/";
  }

  if (page.kind === "location") {
    return `/networking-groups/${page.slug}`;
  }

  if (page.kind === "article") {
    return `/insights/${page.slug}`;
  }

  return `/${page.slug}`;
}

export function getArticleReadingMinutes(
  page: Pick<Page, "intro" | "sections">,
) {
  const text = [page.intro, ...page.sections.map((s) => `${s.heading} ${s.body}`)].join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function formatArticleDate(date: Date | null | undefined) {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(date);
}

/** Slugs reserved by first-party app routes — standard pages must not use these. */
export const RESERVED_ROOT_SLUGS = new Set([
  "directory",
  "visit",
  "networking-groups",
  "trades",
  "open-seats",
  "insights",
  "members",
  "settings",
  "exports",
  "pages",
  "enquiries",
  "sign-in",
  "sign-up",
  "my-profile",
  "api",
  "md",
  "llms.txt",
  "llms-full.txt",
  "robots.txt",
  "sitemap.xml",
  "opengraph-image",
]);
