ALTER TABLE "chapter_settings" ADD COLUMN IF NOT EXISTS "tyfcb_amount" numeric;
--> statement-breakpoint
ALTER TABLE "chapter_settings" ADD COLUMN IF NOT EXISTS "tyfcb_currency" text DEFAULT 'GBP';
--> statement-breakpoint
ALTER TABLE "chapter_settings" ADD COLUMN IF NOT EXISTS "tyfcb_checked_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "chapter_settings" ADD COLUMN IF NOT EXISTS "tyfcb_updated_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "chapter_settings" ADD COLUMN IF NOT EXISTS "tyfcb_source_url" text;
--> statement-breakpoint
ALTER TABLE "chapter_settings" ADD COLUMN IF NOT EXISTS "tyfcb_enabled" boolean DEFAULT true NOT NULL;
