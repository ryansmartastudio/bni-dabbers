import type { NewPage } from "../../src/db/schema";

type SeedPage = Omit<NewPage, "id" | "createdAt" | "updatedAt">;

const published = new Date("2026-09-01T09:00:00.000Z");

export const ARTICLE_PAGES: SeedPage[] = [
  {
    slug: "referral-follow-up-tips",
    kind: "article",
    locationName: null,
    title: "Five referral follow-up habits that protect your reputation",
    metaTitle: "Referral follow-up tips | BNI Dabbers insights",
    metaDescription:
      "Practical follow-up habits after a BNI referral — respond fast, set expectations and close the loop with the referring member.",
    heroEyebrow: "Referrals",
    heroImageUrl: null,
    intro:
      "A referral is a transfer of trust. These five habits help BNI members protect that trust and earn more introductions.",
    sections: [
      {
        id: "rf-1",
        heading: "Respond within one business day",
        body: "Speed signals respect for the referring member and the prospect.",
      },
      {
        id: "rf-2",
        heading: "Thank the referrer privately",
        body: "A short update before the weekly meeting prevents awkward silence in the room.",
      },
      {
        id: "rf-3",
        heading: "Close the loop publicly when appropriate",
        body: "Report outcomes in TYFCB when business closes — it teaches the room what good looks like.",
      },
    ],
    faqs: [],
    ctaHeading: "Practice in the room",
    ctaBody: "Guest visit BNI Dabbers to see referral culture in action.",
    published: true,
    publishedAt: published,
    excerpt: "Respond fast, communicate clearly and close the loop so referrers keep sending work your way.",
    sortOrder: 300,
  },
  {
    slug: "cheshire-east-business-outlook",
    kind: "article",
    locationName: null,
    title: "Why Cheshire East owners are doubling down on local referrals",
    metaTitle: "Cheshire East business networking outlook",
    metaDescription:
      "Local referral networks are growing in Cheshire East as owners seek predictable introductions beyond social media.",
    heroEyebrow: "Local business",
    heroImageUrl: null,
    intro:
      "Across Crewe, Nantwich and Sandbach, owners are prioritising **trusted introductions** over cold outreach.",
    sections: [
      {
        id: "ceo-1",
        heading: "Trust beats volume",
        body: "Weekly face-to-face contact builds the know-like-trust factor that algorithms cannot replicate.",
      },
      {
        id: "ceo-2",
        heading: "Cross-town reach",
        body: "A single chapter at {{venueName}} connects towns that rarely meet at generic networking events.",
      },
    ],
    faqs: [],
    ctaHeading: "Join the conversation",
    ctaBody: "Visit a {{meetingDay}} meeting and meet owners from across Cheshire East.",
    published: true,
    publishedAt: new Date("2026-09-08T09:00:00.000Z"),
    excerpt: "Trusted introductions are replacing spray-and-pray marketing for many SMEs in the borough.",
    sortOrder: 310,
  },
  {
    slug: "guest-visit-checklist",
    kind: "article",
    locationName: null,
    title: "Guest visit checklist for first-time BNI visitors",
    metaTitle: "BNI guest visit checklist | BNI Dabbers",
    metaDescription:
      "Printable-style checklist before your first BNI Dabbers guest visit — travel, pitch and questions.",
    heroEyebrow: "Guest visits",
    heroImageUrl: null,
    intro: "Use this checklist the night before your **guest visit** to BNI Dabbers.",
    sections: [
      {
        id: "gvc-1",
        heading: "Before you travel",
        body: "Confirm time, parking, dress and who you will ask for at reception.",
      },
      {
        id: "gvc-2",
        heading: "Your sixty-second story",
        body: "Who you help, problem you solve, geography you serve and ideal referral.",
      },
    ],
    faqs: [],
    ctaHeading: "Book your visit",
    ctaBody: "Request a guest place online — we will confirm by email.",
    published: true,
    publishedAt: new Date("2026-09-15T09:00:00.000Z"),
    excerpt: "Travel, pitch and questions to prepare before your first Thursday morning meeting.",
    sortOrder: 320,
  },
  {
    slug: "one-seat-per-category",
    kind: "article",
    locationName: null,
    title: "Why one seat per category changes referral quality",
    metaTitle: "One member per category | BNI explained",
    metaDescription:
      "BNI's one-seat-per-profession rule reduces competition inside the room and clarifies who to call.",
    heroEyebrow: "BNI rules",
    heroImageUrl: null,
    intro:
      "The **one seat per category** rule is the reason BNI referrals stay unambiguous — and why guests should check [open seats](/open-seats) early.",
    sections: [
      {
        id: "osc-1",
        heading: "Clarity for referrers",
        body: "Members never wonder which accountant or designer to choose — there is one designated seat.",
      },
      {
        id: "osc-2",
        heading: "Commitment from members",
        body: "Holding the seat means representing your profession for the whole chapter.",
      },
    ],
    faqs: [],
    ctaHeading: "See categories in person",
    ctaBody: "Browse the [directory](/directory) then visit a meeting.",
    published: true,
    publishedAt: new Date("2026-09-22T09:00:00.000Z"),
    excerpt: "One professional per seat stops in-room competition and sharpens referral quality.",
    sortOrder: 330,
  },
  {
    slug: "member-spotlight-referral-win",
    kind: "article",
    locationName: null,
    title: "How weekly attendance turns into closed business",
    metaTitle: "Member referral success story framework",
    metaDescription:
      "A practical framework members use to turn BNI attendance into closed business — education, follow-up and TYFCB.",
    heroEyebrow: "Member wins",
    heroImageUrl: null,
    intro:
      "Members who report the strongest TYFCB typically combine **education**, **follow-up** and **consistency**.",
    sections: [
      {
        id: "ms-1",
        heading: "Teach the room",
        body: "Use weekly slots and 1-2-1s so members can spot your ideal client in their contacts.",
      },
      {
        id: "ms-2",
        heading: "Track and thank",
        body: "Log TYFCB promptly — it reinforces behaviour in the room and attracts more referrals.",
      },
    ],
    faqs: [],
    ctaHeading: "Learn from members",
    ctaBody: "Guest visit and ask members how they use the system.",
    published: true,
    publishedAt: new Date("2026-09-29T09:00:00.000Z"),
    excerpt: "Education plus follow-up plus consistency is the pattern behind strong TYFCB reports.",
    sortOrder: 340,
  },
  {
    slug: "networking-vs-sales-pitch",
    kind: "article",
    locationName: null,
    title: "Networking conversation vs sales pitch",
    metaTitle: "Networking vs sales pitch | BNI Dabbers",
    metaDescription:
      "Why BNI meetings reward curiosity over pitching — and how guests should introduce themselves.",
    heroEyebrow: "Communication",
    heroImageUrl: null,
    intro:
      "The fastest way to lose a room is to **pitch**. BNI rewards conversations that clarify who you help.",
    sections: [
      {
        id: "nvs-1",
        heading: "Ask questions first",
        body: "Guests who ask about members' businesses earn better follow-up conversations.",
      },
      {
        id: "nvs-2",
        heading: "Save the deck for 1-2-1s",
        body: "Deep dives belong after the meeting, not during open networking.",
      },
    ],
    faqs: [],
    ctaHeading: "Experience the culture",
    ctaBody: "Visit on {{meetingDay}} and observe how members interact.",
    published: true,
    publishedAt: new Date("2026-10-01T09:00:00.000Z"),
    excerpt: "Curiosity beats pitching in referral-first rooms — especially on your first visit.",
    sortOrder: 350,
  },
];
