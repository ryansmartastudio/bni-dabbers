import { z } from "zod";

export const memberProfileSchema = z.object({
  profileHeadline: z.string().optional(),
  profileSummary: z.string().optional(),
  profileServices: z.array(z.string().trim().min(1)).default([]),
  profileIdealReferral: z.string().optional(),
  profileSourceUrl: z.string().optional(),
  profileGeneratedAt: z.string().datetime().optional().nullable(),
  profilePublished: z.boolean().default(false),
});

export type MemberProfileFormValues = z.infer<typeof memberProfileSchema>;
