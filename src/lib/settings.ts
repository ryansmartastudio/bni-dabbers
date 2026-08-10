import { asc } from "drizzle-orm";
import { db } from "@/db";
import { chapterSettings, charityLinks } from "@/db/schema";
import { getActiveMembers } from "@/lib/members";

export async function getChapterSettings() {
  const settings = await db.query.chapterSettings.findFirst();
  if (settings) return settings;

  const [created] = await db.insert(chapterSettings).values({}).returning();
  return created;
}

export async function getCharityLinks() {
  return db.query.charityLinks.findMany({
    orderBy: [asc(charityLinks.sortOrder)],
  });
}

export async function getBookletData() {
  const [settings, links, activeMembers] = await Promise.all([
    getChapterSettings(),
    getCharityLinks(),
    getActiveMembers(),
  ]);

  return { settings, links, members: activeMembers };
}
