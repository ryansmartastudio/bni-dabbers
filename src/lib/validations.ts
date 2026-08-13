import { z } from "zod";
import { normalizeWebsiteUrl } from "@/lib/members";

export const profileVisibilitySchema = z.object({
  email: z.boolean().default(true),
  phone: z.boolean().default(true),
  website: z.boolean().default(true),
  linkedin: z.boolean().default(true),
  headline: z.boolean().default(true),
  summary: z.boolean().default(true),
  services: z.boolean().default(true),
  idealReferral: z.boolean().default(true),
});

export const coreValueSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().default(""),
  iconKey: z.string().min(1),
  iconUrl: z.string().optional().nullable(),
});

export const memberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  company: z.string().min(1, "Company is required"),
  bniSeat: z.string().min(1, "BNI seat is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(1, "Phone number is required"),
  linkedinUrl: z
    .string()
    .url("Valid URL required")
    .optional()
    .or(z.literal("")),
  websiteUrl: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((value) => {
      if (!value?.trim()) return true;
      try {
        new URL(normalizeWebsiteUrl(value));
        return true;
      } catch {
        return false;
      }
    }, "Enter a valid website URL"),
  headshotUrl: z.string().optional(),
  chapterRoles: z.array(z.string().trim().min(1)).default([]),
  roleGroup: z.enum(["leadership", "support", "committee", "none"]),
  notes: z.string().optional(),
  status: z.enum(["active", "on_leave", "former"]),
  sortOrder: z.coerce.number().int().min(0),
  bookletAtBottom: z.boolean().default(false),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens")
    .optional()
    .or(z.literal("")),
  profileHeadline: z.string().optional(),
  profileSummary: z.string().optional(),
  profileServices: z.array(z.string().trim().min(1)).default([]),
  profileIdealReferral: z.string().optional(),
  profileSourceUrl: z.string().optional(),
  profileGeneratedAt: z.string().datetime().optional().nullable(),
  profilePublished: z.boolean().default(false),
  profileVisibility: profileVisibilitySchema.optional(),
});

export const memberSelfSchema = memberSchema.pick({
  firstName: true,
  lastName: true,
  company: true,
  email: true,
  phone: true,
  linkedinUrl: true,
  websiteUrl: true,
  headshotUrl: true,
  profileHeadline: true,
  profileSummary: true,
  profileServices: true,
  profileIdealReferral: true,
  profileSourceUrl: true,
  profileGeneratedAt: true,
  profilePublished: true,
  profileVisibility: true,
});

export const settingsSchema = z.object({
  chapterName: z.string().min(1),
  websiteUrl: z.string().min(1),
  venueName: z.string().min(1),
  venueAddress: z.string().min(1),
  meetingDay: z.string().min(1),
  meetingStart: z.string().min(1),
  meetingEnd: z.string().min(1),
  presentationSlot: z.string().optional(),
  educationSlot: z.string().optional(),
  trainingEvents: z.string().optional(),
  charityName: z.string().min(1),
  charityParagraph: z.string().optional(),
  charityFootnote: z.string().optional(),
  charityLogoUrl: z.string().optional(),
  bniDabbersBankDetails: z.string().optional(),
  bniGlobalBankDetails: z.string().optional(),
  guestPageCount: z.coerce.number().int().min(1).max(10),
  chapterLogoUrl: z.string().optional(),
  venueLogoUrl: z.string().optional(),
  venuePhotoUrl: z.string().optional(),
  feedbackQrUrl: z
    .string()
    .url("Enter a valid feedback URL")
    .optional()
    .or(z.literal("")),
  feedbackQrLabel: z.string().optional(),
  coreValues: z.array(coreValueSchema).default([]),
});

export const charityLinkSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1),
  url: z.string().url(),
  sortOrder: z.coerce.number().int().min(0),
  placement: z.enum(["charity", "cover"]).default("charity"),
});

export const saveAllSettingsSchema = z.object({
  settings: settingsSchema,
  charityLinks: z.array(charityLinkSchema),
});

export type CoreValueFormValues = z.infer<typeof coreValueSchema>;
export type MemberFormValues = z.infer<typeof memberSchema>;
export type MemberSelfFormValues = z.infer<typeof memberSelfSchema>;
export type ProfileVisibilityFormValues = z.infer<typeof profileVisibilitySchema>;
export type SettingsFormValues = z.infer<typeof settingsSchema>;
export type CharityLinkFormValues = z.infer<typeof charityLinkSchema>;
export type SaveAllSettingsValues = z.infer<typeof saveAllSettingsSchema>;
