-- Members now identify themselves when they join, so Harry can see who is in
-- before starting, and so the export says who to ask about each contact.

CREATE TABLE IF NOT EXISTS "workshop_participants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "workshop_sessions"("id") ON DELETE CASCADE,
  "member_name" text NOT NULL,
  "member_key" text NOT NULL,
  "team" text NOT NULL,
  "joined_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Rejoining, or reloading the page, must not create a second entry.
CREATE UNIQUE INDEX IF NOT EXISTS "workshop_participants_member_idx"
  ON "workshop_participants" ("session_id","member_key");

CREATE INDEX IF NOT EXISTS "workshop_participants_session_idx"
  ON "workshop_participants" ("session_id","joined_at");

-- Who suggested each contact. Needed for the follow-up: whoever knows them
-- makes the invitation.
ALTER TABLE "workshop_contacts"
  ADD COLUMN IF NOT EXISTS "submitter_name" text;
