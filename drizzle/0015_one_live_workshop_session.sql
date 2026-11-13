-- Only one workshop session may be live at a time.
--
-- getLiveSession() creates a session when none exists. With a room full of
-- phones hitting a cold database, a dozen callers each created one and the
-- contacts would have scattered across them. The index makes the race
-- impossible rather than unlikely; losers catch the conflict and re-read.

-- Collapse any existing duplicates onto the newest before adding the index.
UPDATE "workshop_sessions" SET "is_live" = false
WHERE "is_live" = true
  AND "id" <> (
    SELECT "id" FROM "workshop_sessions" WHERE "is_live" = true
    ORDER BY "created_at" DESC LIMIT 1
  );

CREATE UNIQUE INDEX IF NOT EXISTS "workshop_sessions_one_live_idx"
  ON "workshop_sessions" (("is_live")) WHERE "is_live";
