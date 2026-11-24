-- When a member was told the CRM exists.
--
-- Without this the admin page can tell you who has signed in but not who has
-- been emailed, so the only way to know whether the chapter-wide send already
-- went out is to remember. Nullable and additive: every existing row reads as
-- "not emailed", which is true.
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "crm_welcome_sent_at" timestamp with time zone;
