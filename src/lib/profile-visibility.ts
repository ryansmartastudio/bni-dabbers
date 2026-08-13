import type { ProfileVisibility } from "@/db/schema";

export const PROFILE_VISIBILITY_KEYS = [
  "email",
  "phone",
  "website",
  "linkedin",
  "headline",
  "summary",
  "services",
  "idealReferral",
] as const;

export type ProfileVisibilityKey = (typeof PROFILE_VISIBILITY_KEYS)[number];

export const PROFILE_VISIBILITY_GROUPS = [
  {
    title: "Contact details",
    description: "Shown in the contact panel on your public directory page.",
    fields: [
      { key: "email" as const, label: "Email address" },
      { key: "phone" as const, label: "Phone number" },
      { key: "website" as const, label: "Website" },
      { key: "linkedin" as const, label: "LinkedIn" },
    ],
  },
  {
    title: "Profile content",
    description:
      "Shown when your profile is published. Hidden sections stay saved but are not visible to visitors.",
    fields: [
      { key: "headline" as const, label: "Profile headline" },
      { key: "summary" as const, label: "Company story" },
      { key: "services" as const, label: "Services" },
      { key: "idealReferral" as const, label: "Ideal referral" },
    ],
  },
] as const;

export const DEFAULT_PROFILE_VISIBILITY: Record<ProfileVisibilityKey, boolean> =
  {
    email: true,
    phone: true,
    website: true,
    linkedin: true,
    headline: true,
    summary: true,
    services: true,
    idealReferral: true,
  };

export function resolveProfileVisibility(
  stored: ProfileVisibility | null | undefined,
): Record<ProfileVisibilityKey, boolean> {
  return {
    ...DEFAULT_PROFILE_VISIBILITY,
    ...stored,
  };
}

export function isProfileFieldVisible(
  stored: ProfileVisibility | null | undefined,
  key: ProfileVisibilityKey,
): boolean {
  return resolveProfileVisibility(stored)[key];
}

export function hasVisibleContactFields(
  member: {
    email: string;
    phone: string;
    websiteUrl: string | null;
    linkedinUrl: string | null;
    profileVisibility?: ProfileVisibility | null;
  },
): boolean {
  const visibility = resolveProfileVisibility(member.profileVisibility);
  return (
    (visibility.email && Boolean(member.email)) ||
    (visibility.phone && Boolean(member.phone)) ||
    (visibility.website && Boolean(member.websiteUrl)) ||
    (visibility.linkedin && Boolean(member.linkedinUrl))
  );
}

export function hasVisiblePublishedContent(
  member: {
    profileHeadline: string | null;
    profileSummary: string | null;
    profileServices: string[];
    profileIdealReferral: string | null;
    profileVisibility?: ProfileVisibility | null;
  },
): boolean {
  const visibility = resolveProfileVisibility(member.profileVisibility);
  return (
    (visibility.headline && Boolean(member.profileHeadline?.trim())) ||
    (visibility.summary && Boolean(member.profileSummary?.trim())) ||
    (visibility.services && member.profileServices.length > 0) ||
    (visibility.idealReferral && Boolean(member.profileIdealReferral?.trim()))
  );
}
