ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "profile_visibility" jsonb DEFAULT '{}'::jsonb NOT NULL;
