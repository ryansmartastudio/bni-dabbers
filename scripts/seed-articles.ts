import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { pages } from "../src/db/schema";
import { ARTICLE_PAGES } from "./seed/article-pages";

async function seedArticles() {
  for (const page of ARTICLE_PAGES) {
    const existing = await db.query.pages.findFirst({
      where: eq(pages.slug, page.slug),
    });

    if (existing) {
      await db
        .update(pages)
        .set({ ...page, updatedAt: new Date() })
        .where(eq(pages.id, existing.id));
      console.log(`Updated article: ${page.slug}`);
      continue;
    }

    await db.insert(pages).values(page);
    console.log(`Created article: ${page.slug}`);
  }
}

seedArticles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
