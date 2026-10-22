import type { NewPage } from "../src/db/schema";
import { ARTICLE_PAGES } from "./seed/article-pages";
import { GUIDE_PAGES } from "./seed/guide-pages";
import { LOCATION_PAGES } from "./seed/location-pages";

type SeedPage = Omit<NewPage, "id" | "createdAt" | "updatedAt">;

const HOME_PAGE: SeedPage = {
  slug: "home",
  kind: "home",
  locationName: "Cheshire East",
  title: "Business networking in Nantwich, Crewe and Cheshire East",
  metaTitle: "Networking groups in Cheshire East | BNI Dabbers",
  metaDescription:
    "BNI Dabbers is a referral-first business networking group for Cheshire East — weekly {{meetingDay}} meetings at {{venueName}}, serving Nantwich, Sandbach and surrounding towns.",
  heroEyebrow: "BNI Dabbers · Cheshire East",
  heroImageUrl: null,
  intro: `Looking for **networking groups in Nantwich**, **Crewe**, **Sandbach** or wider **Cheshire East**? BNI Dabbers is a structured, referral-first chapter that meets every {{meetingDay}} morning at {{venueName}}.\n\nOur members passed **{{tyfcbHeadline}}** in closed business over the last 12 months (verified {{tyfcbVerified}}). Browse members, explore location guides, or request a guest visit.`,
  sections: [
    {
      id: "home-why-bni",
      heading: "Referral-first networking, not just introductions",
      body:
        "BNI is built around tracked referrals and long-term professional relationships. Members meet weekly, learn each other's businesses in depth and pass qualified introductions — which is why many owners searching for networking groups in Cheshire choose a BNI chapter when they want results, not just attendance.",
    },
    {
      id: "home-areas",
      heading: "Serving business owners across Cheshire East",
      body:
        "Our members live and work across the region — from Nantwich and Crewe to Sandbach and neighbouring towns. The chapter meets centrally at {{venueName}} so owners can build a strong local network without travelling into a city centre every week.",
    },
    {
      id: "home-guests",
      heading: "Visit as a guest on a {{meetingDay}} morning",
      body: `{{meetingFacts}}\n\nUse the visit form to request a guest place. You will meet the membership committee, hear member stories and see whether the culture and trade mix fit your business.`,
    },
  ],
  faqs: [
    {
      question: "What is BNI Dabbers?",
      answer:
        "BNI Dabbers is the Cheshire East Dabbers chapter of BNI — a weekly business networking group focused on referrals, accountability and professional relationships.",
    },
    {
      question: "Where do networking groups meet near Nantwich?",
      answer:
        "BNI Dabbers meets at {{venueLine}} — within easy reach of Nantwich and much of Cheshire East.",
    },
    {
      question: "Can I see members before visiting?",
      answer:
        "Yes. Use the member directory to browse active seats, companies and public profiles.",
    },
    {
      question: "How do I request a guest visit?",
      answer:
        "Complete the visit form on this website. A chapter representative will reply with guest visit details.",
    },
  ],
  ctaHeading: "Ready to visit BNI Dabbers?",
  ctaBody:
    "Request a guest place at the next {{meetingDay}} morning meeting and meet members from across Cheshire East.",
  published: true,
  publishedAt: null,
  excerpt: null,
  sortOrder: 0,
};

export const SEED_PAGES: SeedPage[] = [
  HOME_PAGE,
  ...LOCATION_PAGES,
  ...GUIDE_PAGES,
  ...ARTICLE_PAGES,
];
