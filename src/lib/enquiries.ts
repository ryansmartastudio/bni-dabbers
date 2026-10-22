import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { enquiries } from "@/db/schema";

export async function listEnquiries(limit = 200) {
  return db.query.enquiries.findMany({
    orderBy: [desc(enquiries.createdAt)],
    limit,
  });
}

export async function countRecentEnquiriesByEmail(email: string, minutes = 10) {
  const since = new Date(Date.now() - minutes * 60 * 1000);

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enquiries)
    .where(
      and(
        eq(enquiries.email, email.toLowerCase()),
        gte(enquiries.createdAt, since),
      ),
    );

  return result?.count ?? 0;
}
