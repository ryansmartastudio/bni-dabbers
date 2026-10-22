import type { Metadata } from "next";
import { getMarkdownUrlForHtmlPath } from "@/lib/ai/markdown-paths";
import { absoluteUrl } from "@/lib/site-url";

export function buildStaticPageMetadata(
  path: string,
  title: string,
  description: string,
): Metadata {
  const url = absoluteUrl(path);
  const markdownUrl = getMarkdownUrlForHtmlPath(path);

  return {
    title: { absolute: title },
    description,
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
      title,
      description,
      url,
      type: "website",
    },
  };
}
