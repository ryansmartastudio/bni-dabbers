import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const DISALLOW = [
  "/members",
  "/settings",
  "/exports",
  "/my-profile",
  "/pages",
  "/enquiries",
  "/api/",
  "/sign-in",
  "/sign-up",
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/md/"],
        disallow: DISALLOW,
      },
      {
        userAgent: "GPTBot",
        allow: ["/", "/md/", "/llms.txt", "/llms-full.txt"],
        disallow: DISALLOW,
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/", "/md/", "/llms.txt", "/llms-full.txt"],
        disallow: DISALLOW,
      },
      {
        userAgent: "Google-Extended",
        allow: ["/", "/md/"],
        disallow: DISALLOW,
      },
      {
        userAgent: "anthropic-ai",
        allow: ["/", "/md/", "/llms.txt", "/llms-full.txt"],
        disallow: DISALLOW,
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/", "/md/", "/llms.txt", "/llms-full.txt"],
        disallow: DISALLOW,
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/md/", "/llms.txt", "/llms-full.txt"],
        disallow: DISALLOW,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl.replace(/^https?:\/\//, ""),
  };
}
