import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { members } from "../src/db/schema";
import { buildUniqueMemberSlug } from "../src/lib/members";

async function backfillSlugs() {
  const allMembers = await db.query.members.findMany();
  let updated = 0;

  for (const member of allMembers) {
    if (member.slug) continue;

    const slug = await buildUniqueMemberSlug(member, member.id);
    await db
      .update(members)
      .set({ slug, updatedAt: new Date() })
      .where(eq(members.id, member.id));
    updated += 1;
    console.log(`Slug: ${member.firstName} ${member.lastName} -> ${slug}`);
  }

  console.log(`Backfill complete. Updated ${updated} member(s).`);
}

backfillSlugs().catch((error) => {
  console.error(error);
  process.exit(1);
});
