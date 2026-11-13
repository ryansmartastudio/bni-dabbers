-- The members' portal: a small CRM over each session's contacts.
--
-- Members sign in with a shared password, claim a contact to say they will
-- make the invitation, and correct its details. All additive: the workshop
-- app itself is unchanged and runs on Thursday regardless.

ALTER TABLE "workshop_sessions"
  ADD COLUMN IF NOT EXISTS "portal_password" text;

ALTER TABLE "workshop_contacts"
  ADD COLUMN IF NOT EXISTS "claimed_by" text,
  ADD COLUMN IF NOT EXISTS "claimed_by_key" text,
  ADD COLUMN IF NOT EXISTS "claimed_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "website" text,
  ADD COLUMN IF NOT EXISTS "notes" text,
  ADD COLUMN IF NOT EXISTS "invited_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone;

-- Claimed contacts are the ones members work from, so they are looked up by
-- claimant far more often than anything else here.
CREATE INDEX IF NOT EXISTS "workshop_contacts_claimed_idx"
  ON "workshop_contacts" ("session_id", "claimed_by_key");
