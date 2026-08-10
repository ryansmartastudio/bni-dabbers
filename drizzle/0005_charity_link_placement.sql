ALTER TABLE "charity_links" ADD COLUMN "placement" text DEFAULT 'charity' NOT NULL;--> statement-breakpoint
UPDATE "charity_links" SET "placement" = 'cover' WHERE "label" ILIKE '%chapter%';
