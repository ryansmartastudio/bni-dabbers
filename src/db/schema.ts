import { sql } from "drizzle-orm";
import {
  boolean,
  date,
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

/**
 * A chapter is the tenant boundary.
 *
 * Dabbers is chapter one and, for now, the only one. The column exists on
 * every table that holds a chapter's own data so that opening this up to
 * another chapter later is configuration rather than a migration of live
 * records — which is the part that would otherwise have to happen under
 * pressure, with real visitors in the table.
 */
export const chapters = pgTable("chapters", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const members = pgTable("members", {
  id: uuid("id").defaultRandom().primaryKey(),
  chapterId: uuid("chapter_id")
    .notNull()
    .references(() => chapters.id, { onDelete: "cascade" }),
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
  /**
   * Should see the chapter's reports and member access. Held here rather
   * than only in Clerk because a member can be named an admin before they
   * have ever signed in, which is exactly when it is usually decided.
   */
  isChapterAdmin: boolean("is_chapter_admin").default(false).notNull(),
  /** When this member was emailed to say the CRM is open. */
  crmWelcomeSentAt: timestamp("crm_welcome_sent_at", { withTimezone: true }),
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
  chapterId: uuid("chapter_id")
    .notNull()
    .references(() => chapters.id, { onDelete: "cascade" }),
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
  /** Shared password members use to reach the portal. Set from admin. */
  portalPassword: text("portal_password"),
  isLive: boolean("is_live").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [
  // Only one session may be live, so a cold start under load cannot split
  // contacts across several. Scoped to the chapter rather than global: two
  // chapters running a workshop on the same Thursday is the point of tenancy.
  uniqueIndex("workshop_sessions_one_live_idx")
    .on(table.chapterId)
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
    /** The member who has taken on inviting them. One at a time. */
    claimedBy: text("claimed_by"),
    claimedByKey: text("claimed_by_key"),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    /** Details the claimant can correct from the portal. */
    website: text("website"),
    notes: text("notes"),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
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
    index("workshop_contacts_claimed_idx").on(table.sessionId, table.claimedByKey),
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

/* ---------------------------------------------------------------------------
   The CRM.

   Deliberately NOT built on workshop_contacts. That table is the record of
   what happened in the room — round, seat, submitting team, points, and
   session-scoped unique indexes that make the scoring work. Months of
   follow-up churn would destroy it, a manually added visitor has no round or
   seat to put in its NOT NULL columns, and the next workshop has to keep
   working while this is being built. So the room's record stays as it is and
   a promotion step copies contacts across into the pipeline.
   --------------------------------------------------------------------------- */

export const crmStageEnum = pgEnum("crm_stage", [
  "to_invite",
  "invited",
  "visit_booked",
  "visited",
  "joined",
  "not_now",
]);

export const crmNoteKindEnum = pgEnum("crm_note_kind", [
  "note",
  "stage_change",
  "claim",
  "release",
  "reminder_sent",
  "reminder_answered",
  "system",
]);

export const crmAnswerEnum = pgEnum("crm_answer", ["yes", "no"]);

export const crmVisitors = pgTable(
  "crm_visitors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    chapterId: uuid("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    /** Which workshop produced this visitor. Null means someone typed them in. */
    sourceWorkshopSessionId: uuid("source_workshop_session_id").references(
      () => workshopSessions.id,
      { onDelete: "set null" },
    ),
    /** Provenance, and what makes the promotion step idempotent. */
    sourceWorkshopContactId: uuid("source_workshop_contact_id").references(
      () => workshopContacts.id,
      { onDelete: "set null" },
    ),
    stage: crmStageEnum("stage").default("to_invite").notNull(),
    name: text("name").notNull(),
    company: text("company"),
    phone: text("phone"),
    email: text("email"),
    website: text("website"),
    /** The seat or trade they would fill. */
    category: text("category"),
    /** The member who has taken on inviting them. One at a time. */
    ownerMemberId: uuid("owner_member_id").references(() => members.id, {
      onDelete: "set null",
    }),
    ownerClaimedAt: timestamp("owner_claimed_at", { withTimezone: true }),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    visitBookedFor: date("visit_booked_for"),
    visitedAt: timestamp("visited_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    addedByMemberId: uuid("added_by_member_id").references(() => members.id, {
      onDelete: "set null",
    }),
    /**
     * Out of the pipeline without being destroyed. Archiving is the reversible
     * option and the one the UI pushes; a permanent delete is admin-only and
     * takes the timeline with it, which is the whole reason it is not the
     * default.
     */
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    archivedByMemberId: uuid("archived_by_member_id").references(
      () => members.id,
      { onDelete: "set null" },
    ),
    /**
     * Advisory only — NOT unique. The same person met at two workshops is two
     * records that share no history, which is the rule we agreed. These keys
     * exist so adding someone can warn "there is already a Jane Smith at Acme
     * from November", not so the database can refuse them.
     */
    nameKey: text("name_key").notNull(),
    companyKey: text("company_key").notNull(),
    phoneKey: text("phone_key"),
    emailKey: text("email_key"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("crm_visitors_board_idx").on(table.chapterId, table.stage),
    // The board reads live rows only, so its index should too.
    index("crm_visitors_live_board_idx")
      .on(table.chapterId, table.stage)
      .where(sql`${table.archivedAt} is null`),
    index("crm_visitors_owner_idx").on(table.chapterId, table.ownerMemberId),
    index("crm_visitors_dupe_idx").on(
      table.chapterId,
      table.nameKey,
      table.companyKey,
    ),
    // Running the promotion twice must not create a second copy.
    uniqueIndex("crm_visitors_source_contact_idx")
      .on(table.sourceWorkshopContactId)
      .where(sql`${table.sourceWorkshopContactId} is not null`),
  ],
);

/**
 * One chronological story per visitor: what people wrote and what the system
 * did, in the same timeline. This is the notes feature and the audit trail at
 * once — the portal today has neither, and a release silently destroys the
 * fact that anyone ever claimed or invited them.
 */
export const crmNotes = pgTable(
  "crm_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    chapterId: uuid("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => crmVisitors.id, { onDelete: "cascade" }),
    /** Null for anything the system wrote, or a member since removed. */
    authorMemberId: uuid("author_member_id").references(() => members.id, {
      onDelete: "set null",
    }),
    kind: crmNoteKindEnum("kind").default("note").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("crm_notes_visitor_idx").on(table.visitorId, table.createdAt),
    index("crm_notes_chapter_idx").on(table.chapterId, table.createdAt),
  ],
);

/**
 * A scheduled nudge, and the single-use link that answers it.
 *
 * Only the SHA-256 of the token is stored. The token itself exists in the
 * email and nowhere else, so a copy of this table opens nothing.
 */
export const crmReminders = pgTable(
  "crm_reminders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    chapterId: uuid("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => crmVisitors.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    /** 1-4. The cap is what stops this becoming spam. */
    attempt: integer("attempt").default(1).notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    /** Stamped only once Resend has accepted it, so a crash cannot double-send. */
    sentAt: timestamp("sent_at", { withTimezone: true }),
    answeredAt: timestamp("answered_at", { withTimezone: true }),
    answer: crmAnswerEnum("answer"),
    tokenHash: text("token_hash").notNull().unique(),
    tokenExpiresAt: timestamp("token_expires_at", {
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("crm_reminders_due_idx").on(table.dueAt),
    index("crm_reminders_visitor_idx").on(table.visitorId, table.createdAt),
  ],
);

export type Chapter = typeof chapters.$inferSelect;
export type CrmVisitor = typeof crmVisitors.$inferSelect;
export type NewCrmVisitor = typeof crmVisitors.$inferInsert;
export type CrmNote = typeof crmNotes.$inferSelect;
export type CrmReminder = typeof crmReminders.$inferSelect;

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
