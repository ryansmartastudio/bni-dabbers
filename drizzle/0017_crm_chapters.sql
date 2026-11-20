-- Chapters (the tenant boundary) and the CRM pipeline.
--
-- Written to be safe to run twice: every create is IF NOT EXISTS, the chapter
-- insert is ON CONFLICT DO NOTHING, and the backfills only touch NULLs. The
-- NOT NULL constraints are added AFTER their backfill, so the table is never
-- in a state where existing rows violate it.

CREATE TABLE IF NOT EXISTS "chapters" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "chapters" ("name", "slug") VALUES ('BNI Dabbers', 'dabbers')
  ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint

-- members
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "chapter_id" uuid
  REFERENCES "chapters"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "members"
  SET "chapter_id" = (SELECT "id" FROM "chapters" WHERE "slug" = 'dabbers')
  WHERE "chapter_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "members" ALTER COLUMN "chapter_id" SET NOT NULL;
--> statement-breakpoint

-- workshop_sessions
ALTER TABLE "workshop_sessions" ADD COLUMN IF NOT EXISTS "chapter_id" uuid
  REFERENCES "chapters"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "workshop_sessions"
  SET "chapter_id" = (SELECT "id" FROM "chapters" WHERE "slug" = 'dabbers')
  WHERE "chapter_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "workshop_sessions" ALTER COLUMN "chapter_id" SET NOT NULL;
--> statement-breakpoint

-- "One live session" becomes per chapter, so two chapters can run a workshop
-- on the same Thursday.
DROP INDEX IF EXISTS "workshop_sessions_one_live_idx";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "workshop_sessions_one_live_idx"
  ON "workshop_sessions" ("chapter_id") WHERE "is_live";
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "crm_stage" AS ENUM ('to_invite', 'invited', 'visit_booked', 'visited', 'joined', 'not_now');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "crm_note_kind" AS ENUM ('note', 'stage_change', 'claim', 'release', 'reminder_sent', 'reminder_answered', 'system');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "crm_answer" AS ENUM ('yes', 'no');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "crm_visitors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chapter_id" uuid NOT NULL REFERENCES "chapters"("id") ON DELETE CASCADE,
  "source_workshop_session_id" uuid REFERENCES "workshop_sessions"("id") ON DELETE SET NULL,
  "source_workshop_contact_id" uuid REFERENCES "workshop_contacts"("id") ON DELETE SET NULL,
  "stage" "crm_stage" DEFAULT 'to_invite' NOT NULL,
  "name" text NOT NULL,
  "company" text,
  "phone" text,
  "email" text,
  "website" text,
  "category" text,
  "owner_member_id" uuid REFERENCES "members"("id") ON DELETE SET NULL,
  "owner_claimed_at" timestamp with time zone,
  "invited_at" timestamp with time zone,
  "visit_booked_for" date,
  "visited_at" timestamp with time zone,
  "closed_at" timestamp with time zone,
  "added_by_member_id" uuid REFERENCES "members"("id") ON DELETE SET NULL,
  "name_key" text NOT NULL,
  "company_key" text NOT NULL,
  "phone_key" text,
  "email_key" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_visitors_board_idx" ON "crm_visitors" ("chapter_id", "stage");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_visitors_owner_idx" ON "crm_visitors" ("chapter_id", "owner_member_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_visitors_dupe_idx" ON "crm_visitors" ("chapter_id", "name_key", "company_key");
--> statement-breakpoint
-- Promotion must be idempotent: one pipeline record per workshop contact.
CREATE UNIQUE INDEX IF NOT EXISTS "crm_visitors_source_contact_idx"
  ON "crm_visitors" ("source_workshop_contact_id")
  WHERE "source_workshop_contact_id" IS NOT NULL;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "crm_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chapter_id" uuid NOT NULL REFERENCES "chapters"("id") ON DELETE CASCADE,
  "visitor_id" uuid NOT NULL REFERENCES "crm_visitors"("id") ON DELETE CASCADE,
  "author_member_id" uuid REFERENCES "members"("id") ON DELETE SET NULL,
  "kind" "crm_note_kind" DEFAULT 'note' NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_notes_visitor_idx" ON "crm_notes" ("visitor_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_notes_chapter_idx" ON "crm_notes" ("chapter_id", "created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "crm_reminders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chapter_id" uuid NOT NULL REFERENCES "chapters"("id") ON DELETE CASCADE,
  "visitor_id" uuid NOT NULL REFERENCES "crm_visitors"("id") ON DELETE CASCADE,
  "member_id" uuid NOT NULL REFERENCES "members"("id") ON DELETE CASCADE,
  "attempt" integer DEFAULT 1 NOT NULL,
  "due_at" timestamp with time zone NOT NULL,
  "sent_at" timestamp with time zone,
  "answered_at" timestamp with time zone,
  "answer" "crm_answer",
  "token_hash" text NOT NULL UNIQUE,
  "token_expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_reminders_due_idx" ON "crm_reminders" ("due_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_reminders_visitor_idx" ON "crm_reminders" ("visitor_id", "created_at");
