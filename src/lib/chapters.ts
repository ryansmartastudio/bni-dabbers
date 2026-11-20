import { eq } from "drizzle-orm";
import { db } from "@/db";
import { chapters, type Chapter } from "@/db/schema";

/**
 * Which chapter a request belongs to.
 *
 * There is one chapter today, so everything resolves to it. The point of this
 * file is that the resolution happens in ONE place: when a second chapter
 * arrives, the workshop host and the signed-in member become the inputs here
 * rather than something to go and find at thirty call sites.
 *
 * The slug is configurable so a second deployment can point at its own row
 * without a code change.
 */
export const DEFAULT_CHAPTER_SLUG =
  process.env.DEFAULT_CHAPTER_SLUG?.trim() || "dabbers";

/** Never changes while the process lives, and every request needs it. */
let cached: Promise<Chapter> | undefined;

async function load(): Promise<Chapter> {
  const row = await db.query.chapters.findFirst({
    where: eq(chapters.slug, DEFAULT_CHAPTER_SLUG),
  });

  if (!row) {
    throw new Error(
      `No chapter with slug "${DEFAULT_CHAPTER_SLUG}". Run the 0017 migration, which creates it.`,
    );
  }
  return row;
}

export function getDefaultChapter(): Promise<Chapter> {
  // Re-throwing a cached rejection would keep a transient database error alive
  // for the life of the process, so a failure clears the cache.
  cached ??= load().catch((error) => {
    cached = undefined;
    throw error;
  });
  return cached;
}

export async function getDefaultChapterId(): Promise<string> {
  return (await getDefaultChapter()).id;
}
