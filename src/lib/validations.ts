import { z } from "zod";

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
  headshotUrl: z.string().optional(),
  chapterRole: z.string().optional(),
  roleGroup: z.enum(["leadership", "support", "committee", "none"]),
  notes: z.string().optional(),
  status: z.enum(["active", "on_leave", "former"]),
  sortOrder: z.coerce.number().int().min(0),
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
  charityLogoUrl: z.string().optional(),
  bniDabbersBankDetails: z.string().optional(),
  bniGlobalBankDetails: z.string().optional(),
  guestPageCount: z.coerce.number().int().min(1).max(10),
  chapterLogoUrl: z.string().optional(),
});

export const charityLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
  sortOrder: z.coerce.number().int().min(0),
});

export type MemberFormValues = z.infer<typeof memberSchema>;
export type SettingsFormValues = z.infer<typeof settingsSchema>;
export type CharityLinkFormValues = z.infer<typeof charityLinkSchema>;
