import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const memberStatusEnum = pgEnum("member_status", [
  "active",
  "on_leave",
  "former",
]);

export const roleGroupEnum = pgEnum("role_group", [
  "leadership",
  "support",
  "committee",
  "none",
]);

export const members = pgTable("members", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  company: text("company").notNull(),
  bniSeat: text("bni_seat").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  linkedinUrl: text("linkedin_url"),
  websiteUrl: text("website_url"),
  headshotUrl: text("headshot_url"),
  chapterRoles: text("chapter_roles").array().notNull().default([]),
  roleGroup: roleGroupEnum("role_group").default("none").notNull(),
  notes: text("notes"),
  status: memberStatusEnum("status").default("active").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  bookletAtBottom: boolean("booklet_at_bottom").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const chapterSettings = pgTable("chapter_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  chapterName: text("chapter_name").default("BNI Dabbers").notNull(),
  websiteUrl: text("website_url")
    .default("www.bni-ce.co.uk/cheshire-east-dabbers")
    .notNull(),
  venueName: text("venue_name")
    .default("Wychwood Park Hotel & Golf Club")
    .notNull(),
  venueAddress: text("venue_address")
    .default("Weston, Crewe. CW2 5GP")
    .notNull(),
  venueLogoUrl: text("venue_logo_url"),
  venuePhotoUrl: text("venue_photo_url"),
  meetingDay: text("meeting_day").default("Thursday").notNull(),
  meetingStart: text("meeting_start").default("06:45").notNull(),
  meetingEnd: text("meeting_end").default("08:30").notNull(),
  presentationSlot: text("presentation_slot"),
  educationSlot: text("education_slot"),
  trainingEvents: text("training_events"),
  charityName: text("charity_name").default("Genie's Wish").notNull(),
  charityParagraph: text("charity_paragraph"),
  charityLogoUrl: text("charity_logo_url"),
  bniDabbersBankDetails: text("bni_dabbers_bank_details"),
  bniGlobalBankDetails: text("bni_global_bank_details"),
  guestPageCount: integer("guest_page_count").default(2).notNull(),
  chapterLogoUrl: text("chapter_logo_url"),
  feedbackQrUrl: text("feedback_qr_url"),
  feedbackQrLabel: text("feedback_qr_label").default("Feedback"),
  coreValues: jsonb("core_values")
    .$type<CoreValue[]>()
    .default([])
    .notNull(),
  extras: jsonb("extras").$type<Record<string, unknown>>().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const charityLinks = pgTable("charity_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  label: text("label").notNull(),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type ChapterSettings = typeof chapterSettings.$inferSelect;
export type CharityLink = typeof charityLinks.$inferSelect;

export type CoreValue = {
  id: string;
  title: string;
  description: string;
  iconKey: string;
  iconUrl?: string | null;
};
