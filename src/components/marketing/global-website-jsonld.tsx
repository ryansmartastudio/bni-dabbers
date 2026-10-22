import { JsonLd } from "@/components/marketing/json-ld";
import { loadWithDatabaseSetupFallback } from "@/lib/db-errors";
import { getChapterSettings } from "@/lib/settings";
import { absoluteUrl } from "@/lib/site-url";

const FALLBACK_CHAPTER_NAME = "BNI Dabbers";

export async function GlobalWebsiteJsonLd() {
  const result = await loadWithDatabaseSetupFallback(getChapterSettings);
  const chapterName = result.ok ? result.data.chapterName : FALLBACK_CHAPTER_NAME;
  const siteUrl = absoluteUrl("/");

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        url: siteUrl,
        name: chapterName,
        description:
          "Business networking in Nantwich, Crewe, Sandbach and Cheshire East — BNI Dabbers referral-first chapter.",
        inLanguage: "en-GB",
        publisher: {
          "@id": `${siteUrl}#organization`,
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}#organization`,
        name: chapterName,
        url: siteUrl,
        areaServed: ["Nantwich", "Crewe", "Sandbach", "Cheshire East", "Cheshire"],
        knowsAbout: [
          "business networking",
          "BNI",
          "referral marketing",
          "networking groups Cheshire",
          "networking groups Nantwich",
        ],
      },
    ],
  };

  return <JsonLd data={data} />;
}
