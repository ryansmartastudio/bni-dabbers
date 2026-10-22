import type { Metadata } from "next";
import type { Page } from "@/db/schema";
import { getMarkdownUrlForHtmlPath } from "@/lib/ai/markdown-paths";
import { absoluteUrl } from "@/lib/site-url";

export function buildPageMetadata(page: Page, path: string): Metadata {
  const url = absoluteUrl(path);
  const markdownUrl = getMarkdownUrlForHtmlPath(path);

  return {
    title: { absolute: page.metaTitle },
    description: page.metaDescription,
    alternates: {
      canonical: url,
      ...(markdownUrl
        ? {
            types: {
              "text/markdown": markdownUrl,
            },
          }
        : {}),
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url,
      type: "website",
      images: page.heroImageUrl ? [{ url: page.heroImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: page.metaTitle,
      description: page.metaDescription,
      images: page.heroImageUrl ? [page.heroImageUrl] : undefined,
    },
  };
}
