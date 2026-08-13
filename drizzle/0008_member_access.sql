DO $$ BEGIN
 CREATE TYPE "public"."member_invite_status" AS ENUM('pending', 'accepted', 'revoked');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "clerk_user_id" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "members_clerk_user_id_unique" ON "members" ("clerk_user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "member_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"email" text NOT NULL,
	"clerk_invitation_id" text,
	"status" "member_invite_status" DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	"sent_by_user_id" text,
	"last_emailed_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_invites" ADD CONSTRAINT "member_invites_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
