-- Archiving a visitor, and recording who did it.
--
-- Additive and nullable, so the currently deployed build keeps working after
-- this runs: every existing row reads as "not archived", which is what it is.
ALTER TABLE "crm_visitors" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "crm_visitors" ADD COLUMN IF NOT EXISTS "archived_by_member_id" uuid;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "crm_visitors"
    ADD CONSTRAINT "crm_visitors_archived_by_member_id_members_id_fk"
    FOREIGN KEY ("archived_by_member_id") REFERENCES "members"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- The board reads live rows only, so the index it uses should too. A partial
-- index also keeps the archive from slowing the board down as it grows.
CREATE INDEX IF NOT EXISTS "crm_visitors_live_board_idx"
  ON "crm_visitors" ("chapter_id", "stage") WHERE "archived_at" IS NULL;
