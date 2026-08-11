import { z } from "zod";

const MAX_TEXT_LENGTH = 15_000;
const FETCH_TIMEOUT_MS = 15_000;

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

const USER_AGENTS = [
  "Mozilla/5.0 (compatible; BNIDabbersDirectoryBot/1.0; +https://bni-dabbers.vercel.app)",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
];

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripHtml(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function extractMeta(html: string, name: string) {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }

  return "";
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return decodeHtmlEntities(match?.[1]?.replace(/\s+/g, " ").trim() ?? "");
}

function resolveUrl(base: string, href: string) {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function normalizePageUrl(url: string) {
  const parsed = new URL(url);
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

function linkLabel(htmlFragment: string) {
  return stripHtml(htmlFragment).toLowerCase();
}

function isUsefulFollowUpPath(pathname: string) {
  return /(about|service|commercial|wrapping|wrap|fleet|brand|company|what-we-do|our-work)/i.test(
    pathname,
  );
}

function findFollowUpUrls(baseUrl: string, html: string) {
  const origin = new URL(baseUrl).origin;
  const baseNormalized = normalizePageUrl(baseUrl);
  const candidates: string[] = [];
  const linkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(html)) !== null) {
    const href = match[1];
    const label = linkLabel(match[2]);
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) continue;

    const resolved = resolveUrl(baseUrl, href);
    if (!resolved || !resolved.startsWith(origin)) continue;

    const normalized = normalizePageUrl(resolved);
    if (normalized === baseNormalized) continue;
    if (candidates.includes(normalized)) continue;

    const pathname = new URL(resolved).pathname;
    const labelMatches =
      /(about|services|what we do|our work|company|commercial|wrapping|fleet|branding)/i.test(
        label,
      );
    const pathMatches = isUsefulFollowUpPath(pathname);

    if (labelMatches || pathMatches) {
      candidates.push(normalized);
    }
  }

  return candidates.slice(0, 2);
}

async function fetchHtml(url: string) {
  let lastError: unknown;
  let lastStatus: number | undefined;

  for (const userAgent of USER_AGENTS) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": userAgent,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-GB,en;q=0.9",
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        redirect: "follow",
        cache: "no-store",
      });

      lastStatus = response.status;

      if (response.status === 403 || response.status === 401) {
        continue;
      }

      if (!response.ok) {
        throw new Error(`Website returned ${response.status}`);
      }

      const html = await response.text();
      if (html.length < 200) {
        throw new Error("Website returned an empty response");
      }

      return html;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastStatus === 403 || lastStatus === 401) {
    throw new Error(`Website blocked our request (${lastStatus})`);
  }

  throw lastError instanceof Error ? lastError : new Error("Website fetch failed");
}

async function fetchPageText(url: string) {
  const html = await fetchHtml(url);
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
    const followUps = findFollowUpUrls(normalized, homepage.html);
    const chunks = [homepage.text];

    for (const followUp of followUps) {
      try {
        const secondary = await fetchPageText(followUp);
        chunks.push(secondary.text);
      } catch {
        // Keep whatever pages we already have.
      }
    }

    const combinedText = chunks.join("\n\n").slice(0, MAX_TEXT_LENGTH);

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
  } catch (error) {
    const detail =
      error instanceof Error && error.message ? ` ${error.message}.` : "";
    return {
      code: "unreachable",
      message: `We couldn't fetch this website.${detail} Check the URL or write the profile manually.`,
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
