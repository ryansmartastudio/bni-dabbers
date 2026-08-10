ALTER TABLE "chapter_settings" ADD COLUMN "venue_logo_url" text;--> statement-breakpoint
ALTER TABLE "chapter_settings" ADD COLUMN "venue_photo_url" text;--> statement-breakpoint
ALTER TABLE "chapter_settings" ADD COLUMN "feedback_qr_url" text;--> statement-breakpoint
ALTER TABLE "chapter_settings" ADD COLUMN "feedback_qr_label" text DEFAULT 'Feedback';--> statement-breakpoint
ALTER TABLE "chapter_settings" ADD COLUMN "core_values" jsonb DEFAULT '[]'::jsonb NOT NULL;
