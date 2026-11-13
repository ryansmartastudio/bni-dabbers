-- Contact Collector for the Dabbers Growth Workshop, 19 November 2026.
--
-- Hand-written on purpose: drizzle-kit generate wanted to resolve pre-existing
-- column drift on other tables, so this adds only the new objects and touches
-- nothing that already exists. Safe to re-run.

DO $$ BEGIN
  CREATE TYPE "public"."workshop_state" AS ENUM('waiting','round1','break','round2','ended','slide1','slide2');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "workshop_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "state" "public"."workshop_state" DEFAULT 'waiting' NOT NULL,
  "round1_started_at" timestamp with time zone,
  "round2_started_at" timestamp with time zone,
  "round1_seconds" integer DEFAULT 240 NOT NULL,
  "round2_seconds" integer DEFAULT 120 NOT NULL,
  "constants" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "version" integer DEFAULT 0 NOT NULL,
  "is_live" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "workshop_contacts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "workshop_sessions"("id") ON DELETE CASCADE,
  "round" integer NOT NULL,
  "submitter_team" text NOT NULL,
  "seat_team" text NOT NULL,
  "seat_index" integer NOT NULL,
  "category" text NOT NULL,
  "contact_name" text NOT NULL,
  "company" text NOT NULL,
  "phone" text,
  "email" text,
  "points" integer NOT NULL,
  "name_key" text NOT NULL,
  "company_key" text NOT NULL,
  "phone_key" text,
  "email_key" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Dedupe is enforced here, not in application code, so two phones submitting
-- the same person at the same instant cannot both succeed.
CREATE UNIQUE INDEX IF NOT EXISTS "workshop_contacts_person_idx"
  ON "workshop_contacts" ("session_id","name_key","company_key");
CREATE UNIQUE INDEX IF NOT EXISTS "workshop_contacts_phone_idx"
  ON "workshop_contacts" ("session_id","phone_key") WHERE "phone_key" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "workshop_contacts_email_idx"
  ON "workshop_contacts" ("session_id","email_key") WHERE "email_key" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "workshop_contacts_session_idx"
  ON "workshop_contacts" ("session_id","created_at");
