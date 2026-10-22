import type { Page } from "@/db/schema";

export function buildFallbackHomePage(): Page {
  const now = new Date();

  return {
    id: "fallback-home",
    slug: "home",
    kind: "home",
    locationName: "Cheshire East",
    title: "Business networking in Nantwich, Crewe and Cheshire East",
    metaTitle: "Networking groups in Cheshire East | BNI Dabbers",
    metaDescription:
      "BNI Dabbers is a referral-first business networking group for Cheshire East — weekly {{meetingDay}} meetings at {{venueName}}, serving Nantwich, Sandbach and surrounding towns.",
    heroEyebrow: "BNI Dabbers · Cheshire East",
    heroImageUrl: null,
    intro:
      "Join a structured {{meetingDay}} morning networking group built on referrals, accountability and long-term business relationships.",
    sections: [
      {
        id: "fallback-1",
        heading: "Referral-first networking near Nantwich and Crewe",
        body:
          "BNI Dabbers brings together business owners who want more than casual networking. Members meet weekly, share introductions and track referrals — so relationships turn into real opportunities.",
      },
      {
        id: "fallback-2",
        heading: "Who the chapter is for",
        body:
          "If you run a established business in Cheshire East and want a consistent flow of quality introductions, BNI Dabbers offers a proven framework, supportive chapter culture and access to diverse trades under one roof.",
      },
    ],
    faqs: [
      {
        question: "Where does BNI Dabbers meet?",
        answer: "We meet on {{meetingDay}} mornings at {{venueLine}}.",
      },
      {
        question: "Can I visit as a guest?",
        answer:
          "Yes. Guests are welcome. Use the visit form and we will confirm the next suitable meeting.",
      },
    ],
    ctaHeading: "Visit as a guest",
    ctaBody:
      "Experience a {{meetingDay}} morning meeting, meet members in person, and see whether BNI Dabbers fits your business goals.",
    published: true,
    publishedAt: null,
    excerpt: null,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  };
}
