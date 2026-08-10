import { asc } from "drizzle-orm";
import { db } from "@/db";
import { chapterSettings, charityLinks, members } from "@/db/schema";

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
    db.query.members.findMany({
      where: (m, { eq }) => eq(m.status, "active"),
      orderBy: [asc(members.sortOrder), asc(members.lastName)],
    }),
  ]);

  return { settings, links, members: activeMembers };
}
