ALTER TABLE "members" ADD COLUMN "chapter_roles" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
UPDATE "members" SET "chapter_roles" = ARRAY["chapter_role"] WHERE "chapter_role" IS NOT NULL AND "chapter_role" <> '';--> statement-breakpoint
ALTER TABLE "members" DROP COLUMN "chapter_role";
