import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
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

export const memberInviteStatusEnum = pgEnum("member_invite_status", [
  "pending",
  "accepted",
  "revoked",
]);

export const pageKindEnum = pgEnum("page_kind", [
  "home",
  "location",
  "standard",
  "article",
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
  slug: text("slug").unique(),
  profileHeadline: text("profile_headline"),
  profileSummary: text("profile_summary"),
  profileServices: text("profile_services").array().notNull().default([]),
  profileIdealReferral: text("profile_ideal_referral"),
  profileSourceUrl: text("profile_source_url"),
  profileGeneratedAt: timestamp("profile_generated_at", { withTimezone: true }),
  profilePublished: boolean("profile_published").default(false).notNull(),
  profileVisibility: jsonb("profile_visibility")
    .$type<ProfileVisibility>()
    .default({})
    .notNull(),
  clerkUserId: text("clerk_user_id").unique(),
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
  charityFootnote: text("charity_footnote"),
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
  tyfcbAmount: numeric("tyfcb_amount"),
  tyfcbCurrency: text("tyfcb_currency").default("GBP"),
  tyfcbCheckedAt: timestamp("tyfcb_checked_at", { withTimezone: true }),
  tyfcbUpdatedAt: timestamp("tyfcb_updated_at", { withTimezone: true }),
  tyfcbSourceUrl: text("tyfcb_source_url"),
  tyfcbEnabled: boolean("tyfcb_enabled").default(true).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const memberInvites = pgTable("member_invites", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  clerkInvitationId: text("clerk_invitation_id"),
  status: memberInviteStatusEnum("status").default("pending").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  sentByUserId: text("sent_by_user_id"),
  lastEmailedAt: timestamp("last_emailed_at", { withTimezone: true }),
});

export const charityLinks = pgTable("charity_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  label: text("label").notNull(),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  placement: text("placement").$type<"charity" | "cover">().default("charity").notNull(),
});

export const pages = pgTable("pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  kind: pageKindEnum("kind").default("standard").notNull(),
  locationName: text("location_name"),
  title: text("title").notNull(),
  metaTitle: text("meta_title").notNull(),
  metaDescription: text("meta_description").notNull(),
  heroEyebrow: text("hero_eyebrow"),
  heroImageUrl: text("hero_image_url"),
  intro: text("intro").default("").notNull(),
  sections: jsonb("sections").$type<PageSection[]>().default([]).notNull(),
  faqs: jsonb("faqs").$type<PageFaq[]>().default([]).notNull(),
  ctaHeading: text("cta_heading"),
  ctaBody: text("cta_body"),
  published: boolean("published").default(false).notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  excerpt: text("excerpt"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const enquiries = pgTable("enquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  message: text("message").notNull(),
  sourcePath: text("source_path").notNull(),
  pageSlug: text("page_slug"),
  emailedAt: timestamp("emailed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const workshopStateEnum = pgEnum("workshop_state", [
  "waiting",
  "round1",
  "break",
  "round2",
  "ended",
  "slide1",
  "slide2",
]);

/**
 * One row per run of the Contact Collector. A fresh row is created on reset so
 * test data from the rehearsal never mixes with the live session.
 */
export const workshopSessions = pgTable("workshop_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  state: workshopStateEnum("state").default("waiting").notNull(),
  /** Server clock is authoritative; every client derives its countdown from these. */
  round1StartedAt: timestamp("round1_started_at", { withTimezone: true }),
  round2StartedAt: timestamp("round2_started_at", { withTimezone: true }),
  round1Seconds: integer("round1_seconds").default(240).notNull(),
  round2Seconds: integer("round2_seconds").default(120).notNull(),
  /** Overrides for the closing-slide constants, editable by Harry on the day. */
  constants: jsonb("constants")
    .$type<Partial<WorkshopConstantsShape>>()
    .default({})
    .notNull(),
  /** Bumped on every write so clients can skip unchanged poll responses. */
  version: integer("version").default(0).notNull(),
  isLive: boolean("is_live").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [
  // Only one session may be live, so a cold start under load cannot split
  // contacts across several.
  uniqueIndex("workshop_sessions_one_live_idx")
    .on(table.isLive)
    .where(sql`${table.isLive}`),
]);

export const workshopContacts = pgTable(
  "workshop_contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => workshopSessions.id, { onDelete: "cascade" }),
    round: integer("round").notNull(),
    /** Team of the member who submitted — scores the points. */
    submitterTeam: text("submitter_team").notNull(),
    /** Team that owns the seat — fills the seat progress. */
    seatTeam: text("seat_team").notNull(),
    /** Seat index 0-4, or -1 for the team's free-text "Other". */
    seatIndex: integer("seat_index").notNull(),
    /** Seat name, or the typed category when seatIndex is -1. */
    category: text("category").notNull(),
    contactName: text("contact_name").notNull(),
    company: text("company").notNull(),
    phone: text("phone"),
    email: text("email"),
    points: integer("points").notNull(),
    /** Which member suggested this contact, so the right person invites them. */
    submitterName: text("submitter_name"),
    /** Lower-cased, whitespace-collapsed keys backing the dedupe indexes. */
    nameKey: text("name_key").notNull(),
    companyKey: text("company_key").notNull(),
    phoneKey: text("phone_key"),
    emailKey: text("email_key"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("workshop_contacts_person_idx").on(
      table.sessionId,
      table.nameKey,
      table.companyKey,
    ),
    uniqueIndex("workshop_contacts_phone_idx")
      .on(table.sessionId, table.phoneKey)
      .where(sql`${table.phoneKey} is not null`),
    uniqueIndex("workshop_contacts_email_idx")
      .on(table.sessionId, table.emailKey)
      .where(sql`${table.emailKey} is not null`),
    index("workshop_contacts_session_idx").on(table.sessionId, table.createdAt),
  ],
);

/** Who is in the room, so the board can show a lobby before kick-off. */
export const workshopParticipants = pgTable(
  "workshop_participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => workshopSessions.id, { onDelete: "cascade" }),
    memberName: text("member_name").notNull(),
    /** Normalised name, so a reload cannot create a second entry. */
    memberKey: text("member_key").notNull(),
    team: text("team").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("workshop_participants_member_idx").on(table.sessionId, table.memberKey),
    index("workshop_participants_session_idx").on(table.sessionId, table.joinedAt),
  ],
);

export type WorkshopParticipant = typeof workshopParticipants.$inferSelect;
export type WorkshopSession = typeof workshopSessions.$inferSelect;
export type WorkshopContact = typeof workshopContacts.$inferSelect;
export type NewWorkshopContact = typeof workshopContacts.$inferInsert;

type WorkshopConstantsShape = {
  membersToday: number;
  visitorRate: number;
  conversionRate: number;
  referralsGivenPerMemberMonth: number;
  referralsReceivedPerMemberMonth: number;
  tyfcbLast12Months: number;
};

export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type MemberInvite = typeof memberInvites.$inferSelect;
export type NewMemberInvite = typeof memberInvites.$inferInsert;
export type ChapterSettings = typeof chapterSettings.$inferSelect;
export type CharityLink = typeof charityLinks.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type Enquiry = typeof enquiries.$inferSelect;
export type NewEnquiry = typeof enquiries.$inferInsert;

export type PageSection = {
  id: string;
  heading: string;
  body: string;
  imageUrl?: string | null;
};

export type PageFaq = {
  question: string;
  answer: string;
};

export type CoreValue = {
  id: string;
  title: string;
  description: string;
  iconKey: string;
  iconUrl?: string | null;
};

export type ProfileVisibility = Partial<{
  email: boolean;
  phone: boolean;
  website: boolean;
  linkedin: boolean;
  headline: boolean;
  summary: boolean;
  services: boolean;
  idealReferral: boolean;
}>;
