-- Who should be a chapter admin, decided by the member record.
--
-- Clerk's public metadata stays the thing the app and the middleware read,
-- because that is already wired through sessionClaims. This column is who
-- OUGHT to have it, which is a different question and the only one that can
-- be answered before somebody has signed up at all. The two are reconciled
-- the first time a flagged member is seen.
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "is_chapter_admin" boolean DEFAULT false NOT NULL;
