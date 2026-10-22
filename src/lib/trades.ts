import type { Member } from "@/db/schema";
import { getActiveMembers } from "@/lib/members";

export type TradeGroup = {
  slug: string;
  seatLabel: string;
  members: Member[];
};

export type TradeCopy = {
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  buyerGuideHeading: string;
  buyerGuideBody: string;
  faqs: Array<{ question: string; answer: string }>;
};

const TRADE_COPY: Record<string, TradeCopy> = {
  accountant: {
    title: "Accountants in Cheshire East",
    metaTitle: "Accountant Cheshire East | BNI Dabbers member directory",
    metaDescription:
      "Find a BNI Dabbers accountant serving Crewe, Nantwich and Cheshire East — trusted for referrals from local business owners.",
    intro:
      "When you need an accountant who understands local SMEs, start with a professional referred by people who meet them every week.",
    buyerGuideHeading: "What to look for in a local accountant",
    buyerGuideBody:
      "Ask about experience with your sector, proactive tax planning, and responsiveness at year-end. A strong referral relationship means your accountant is accountable to peers as well as to you.",
    faqs: [
      {
        question: "Can I hire a BNI Dabbers accountant if I am not a member?",
        answer:
          "Yes. Member profiles are public so you can research and contact them directly. Many clients come through referrals from existing customers.",
      },
      {
        question: "Do chapter accountants serve Crewe and Nantwich?",
        answer:
          "Members typically serve Cheshire East and surrounding towns. Check each profile for company location and services.",
      },
      {
        question: "How do referrals work for professional services?",
        answer:
          "BNI members pass qualified introductions when they know, like and trust a fellow member's work — which is why directory profiles matter.",
      },
    ],
  },
  "web-design": {
    title: "Web design in Cheshire East",
    metaTitle: "Web designer Cheshire East | BNI Dabbers",
    metaDescription:
      "Browse BNI Dabbers web design members — businesses referred by Cheshire East networking peers.",
    intro:
      "Need a website that converts and reflects your brand? These designers are vouched for by fellow chapter members.",
    buyerGuideHeading: "Choosing a web designer locally",
    buyerGuideBody:
      "Review live sites in their portfolio, clarify ownership of code and content, and agree maintenance after launch. Referral-based designers often stay engaged because their reputation in the room depends on delivery.",
    faqs: [
      {
        question: "Will a member work with startups?",
        answer: "Many do — read each profile and message through the contact details shown when profiles are published.",
      },
      {
        question: "Can I visit the chapter before hiring anyone?",
        answer: "Yes. Request a guest visit to meet members in person before you commission work.",
      },
      {
        question: "Are these freelancers or agencies?",
        answer: "The chapter includes both. The seat label reflects their BNI category; company details are on each profile.",
      },
    ],
  },
};

const GENERIC_TRADE_FAQS = (label: string) => [
  {
    question: `Why use a BNI Dabbers ${label.toLowerCase()}?`,
    answer:
      "Members are accountable to the chapter weekly. Referrals only flow when work is trusted — a higher bar than an anonymous listing.",
  },
  {
    question: "How do I contact a member?",
    answer: "Open their directory profile for company details and public contact options where published.",
  },
  {
    question: "Can I visit a meeting first?",
    answer: "Yes — request a guest visit on our Visit page to meet members including this trade category.",
  },
];

export function slugifySeat(seat: string) {
  return seat
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Chapter / regional BNI roles — not buyer-facing trade categories. */
export function isExcludedFromTradeDirectory(seatLabel: string): boolean {
  const seat = seatLabel.trim().toLowerCase();
  if (!seat) return true;
  return seat.includes("ambassador") || seat.includes("director consultant");
}

export async function getTradeGroups(): Promise<TradeGroup[]> {
  const members = await getActiveMembers();
  const map = new Map<string, TradeGroup>();

  for (const member of members) {
    if (isExcludedFromTradeDirectory(member.bniSeat)) continue;
    const slug = slugifySeat(member.bniSeat);
    if (!slug) continue;
    const existing = map.get(slug);
    if (existing) {
      existing.members.push(member);
    } else {
      map.set(slug, {
        slug,
        seatLabel: member.bniSeat,
        members: [member],
      });
    }
  }

  return [...map.values()].sort((a, b) => a.seatLabel.localeCompare(b.seatLabel));
}

export function getTradeCopy(slug: string, seatLabel: string): TradeCopy {
  const curated = TRADE_COPY[slug];
  if (curated) return curated;

  return {
    title: `${seatLabel} in Cheshire East`,
    metaTitle: `${seatLabel} Cheshire East | BNI Dabbers`,
    metaDescription: `Find a BNI Dabbers member in the ${seatLabel} category — referred by business owners across Cheshire East.`,
    intro: `Looking for ${seatLabel.toLowerCase()} near Crewe, Nantwich or Sandbach? These chapter members hold the ${seatLabel} seat at BNI Dabbers.`,
    buyerGuideHeading: `Working with a local ${seatLabel.toLowerCase()}`,
    buyerGuideBody:
      "Ask for examples of recent work, clarify scope and timelines, and check who else in your network may already know them through the chapter.",
    faqs: GENERIC_TRADE_FAQS(seatLabel),
  };
}

/**
 * Seats the chapter is recruiting for. A seat is hidden when any active
 * member's BNI seat contains one of its keywords, since roster seat names
 * rarely match these labels exactly (e.g. "Mortgages" fills "Mortgage Adviser").
 */
export const RECRUITMENT_SEATS: Array<{ label: string; keywords: string[] }> = [
  { label: "Recruitment", keywords: ["recruit"] },
  { label: "Commercial Cleaning", keywords: ["cleaning", "cleaner"] },
];

export async function getOpenSeatLabels(): Promise<string[]> {
  const groups = await getTradeGroups();
  const filledSeats = groups.map((g) => g.seatLabel.toLowerCase());
  return RECRUITMENT_SEATS.filter(
    (seat) =>
      !filledSeats.some((filled) =>
        seat.keywords.some((keyword) => filled.includes(keyword)),
      ),
  ).map((seat) => seat.label);
}
