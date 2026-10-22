import type { ChapterSettings, Member, Page, PageFaq } from "@/db/schema";
import { getMemberDisplayName, getMemberProfilePath } from "@/lib/members";
import { absoluteUrl } from "@/lib/site-url";

export function organizationId() {
  return `${absoluteUrl("/")}#organization`;
}

export function buildLocalBusinessJsonLd(settings: ChapterSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${absoluteUrl("/")}#localbusiness`,
    name: settings.chapterName,
    url: absoluteUrl("/"),
    image: settings.venuePhotoUrl ?? settings.chapterLogoUrl ?? undefined,
    parentOrganization: { "@id": organizationId() },
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.venueAddress,
      addressLocality: "Crewe",
      addressRegion: "Cheshire East",
      addressCountry: "GB",
    },
  };
}

function meetingDayToSchema(day: string) {
  const map: Record<string, string> = {
    sunday: "Sunday",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
  };
  return map[day.toLowerCase()] ?? day;
}

export function buildWeeklyMeetingEventJsonLd(settings: ChapterSettings) {
  const day = meetingDayToSchema(settings.meetingDay);
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${settings.chapterName} weekly meeting`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: settings.venueName,
      address: settings.venueAddress,
    },
    eventSchedule: {
      "@type": "Schedule",
      repeatFrequency: "P1W",
      byDay: `https://schema.org/${day}`,
      startTime: settings.meetingStart,
      endTime: settings.meetingEnd,
    },
    description: `Weekly ${settings.meetingDay} business networking meeting at ${settings.venueName}.`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
      description: "Guest visits welcome — confirm via the chapter visit form.",
    },
    organizer: {
      "@id": organizationId(),
    },
  };
}

export function buildMemberProfileJsonLd(member: Member) {
  const path = getMemberProfilePath(member);
  const name = getMemberDisplayName(member);
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${name} | BNI Dabbers`,
    url: absoluteUrl(path),
    mainEntity: {
      "@type": "Person",
      name,
      jobTitle: member.bniSeat,
      worksFor: {
        "@type": "Organization",
        name: member.company,
      },
      image: member.headshotUrl ?? undefined,
      url: member.websiteUrl ?? absoluteUrl(path),
    },
  };
}

export function buildItemListJsonLd(
  name: string,
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

export function buildFaqPageJsonLd(faqs: PageFaq[]) {
  if (faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildWebPageJsonLd(page: Page, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.metaTitle,
    description: page.metaDescription,
    url: absoluteUrl(path),
  };
}
