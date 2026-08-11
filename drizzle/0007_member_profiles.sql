ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "slug" text;
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "profile_headline" text;
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "profile_summary" text;
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "profile_services" text[] DEFAULT '{}' NOT NULL;
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "profile_ideal_referral" text;
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "profile_source_url" text;
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "profile_generated_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "profile_published" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "members" ADD CONSTRAINT "members_slug_unique" UNIQUE("slug");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
