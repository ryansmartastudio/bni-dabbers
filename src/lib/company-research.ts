import { z } from "zod";

const MAX_TEXT_LENGTH = 15_000;

export type CompanyResearchResult = {
  url: string;
  title: string;
  description: string;
  text: string;
};

export type CompanyResearchFailure = {
  code: "missing_url" | "unreachable" | "empty_content";
  message: string;
};

const USER_AGENT =
  "BNIDabbersDirectoryBot/1.0 (+https://bni-dabbers.vercel.app; chapter directory research)";

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMeta(html: string, name: string) {
  const pattern = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const match = html.match(pattern);
  return match?.[1]?.trim() ?? "";
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1]?.replace(/\s+/g, " ").trim() ?? "";
}

function resolveUrl(base: string, href: string) {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function findFollowUpUrl(baseUrl: string, html: string) {
  const origin = new URL(baseUrl).origin;
  const linkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(html)) !== null) {
    const href = match[1];
    const label = stripHtml(match[2]).toLowerCase();
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) continue;
    if (!/(about|services|what we do|our work|company)/i.test(label)) continue;

    const resolved = resolveUrl(baseUrl, href);
    if (!resolved || !resolved.startsWith(origin)) continue;
    if (resolved === baseUrl) continue;
    return resolved;
  }

  return null;
}

async function fetchPageText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(10_000),
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Website returned ${response.status}`);
  }

  const html = await response.text();
  return {
    html,
    title: extractTitle(html),
    description:
      extractMeta(html, "description") ||
      extractMeta(html, "og:description") ||
      "",
    text: stripHtml(html).slice(0, MAX_TEXT_LENGTH),
  };
}

export async function researchCompanyWebsite(
  websiteUrl: string,
): Promise<CompanyResearchResult | CompanyResearchFailure> {
  const trimmed = websiteUrl.trim();
  if (!trimmed) {
    return {
      code: "missing_url",
      message: "Add a website URL on the Details tab before generating a profile.",
    };
  }

  let normalized = trimmed;
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  try {
    const homepage = await fetchPageText(normalized);
    const followUp = findFollowUpUrl(normalized, homepage.html);
    let combinedText = homepage.text;

    if (followUp) {
      try {
        const secondary = await fetchPageText(followUp);
        combinedText = `${homepage.text}\n\n${secondary.text}`.slice(
          0,
          MAX_TEXT_LENGTH,
        );
      } catch {
        // Keep homepage content only.
      }
    }

    if (!combinedText.trim()) {
      return {
        code: "empty_content",
        message:
          "We could reach the website but couldn't extract readable text. Try writing the profile manually.",
      };
    }

    return {
      url: normalized,
      title: homepage.title,
      description: homepage.description,
      text: combinedText,
    };
  } catch {
    return {
      code: "unreachable",
      message:
        "We couldn't fetch this website. Check the URL or write the profile manually.",
    };
  }
}

export const memberProfileDraftSchema = z.object({
  headline: z.string().min(1),
  summary: z.string().min(1),
  services: z.array(z.string().min(1)).min(1).max(8),
  idealReferral: z.string().min(1),
});

export type MemberProfileDraft = z.infer<typeof memberProfileDraftSchema>;
