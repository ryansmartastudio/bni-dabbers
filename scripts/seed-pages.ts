import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { pages } from "../src/db/schema";
import { SEED_PAGES } from "./seed-pages-data";

async function seedPages() {
  for (const page of SEED_PAGES) {
    const existing = await db.query.pages.findFirst({
      where: eq(pages.slug, page.slug),
    });

    if (existing) {
      await db
        .update(pages)
        .set({
          ...page,
          updatedAt: new Date(),
        })
        .where(eq(pages.id, existing.id));
      console.log(`Updated page: ${page.slug}`);
      continue;
    }

    await db.insert(pages).values(page);
    console.log(`Created page: ${page.slug}`);
  }
}

seedPages()
  .then(() => {
    console.log("Seed pages complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
