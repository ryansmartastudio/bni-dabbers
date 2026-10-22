ALTER TYPE "public"."page_kind" ADD VALUE IF NOT EXISTS 'article';
--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "published_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "excerpt" text;
