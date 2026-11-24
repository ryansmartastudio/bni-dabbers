import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { crmVisitors, members } from "@/db/schema";
import { getChapterSettings } from "@/lib/settings";
import { getTyfcbAmount, isTyfcbDisplayEnabled } from "@/lib/tyfcb";
import { DEFAULT_CONSTANTS, type WorkshopConstants } from "@/lib/workshop/config";

export type ProjectionInputs = {
  constants: WorkshopConstants;
  pipelineCount: number;
};

/**
 * What to feed the workshop's sums when they run inside the CRM.
 *
 * A deliberate mix, and worth saying why. The rates -- how many of a list
 * visit, how many visitors join, referrals per member per month -- are the
 * workshop's, because they come from the chapter's own PALMS returns and
 * there is nothing live to replace them with.
 *
 * The head count and the referral total are the live ones instead of the
 * workshop's 34 and £6,331,609. Those were Harry's printed Growth Plan
 * figures and they are a little out of date; more to the point, the toolkit
 * page already states the live 36 and £5.94 million a few sections up, and a
 * page that contradicts itself is worse than one that is slightly stale.
 */
export async function getProjectionInputs(
  chapterId: string,
): Promise<ProjectionInputs> {
  const [settings, [memberRow], [visitorRow]] = await Promise.all([
    getChapterSettings(),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(members)
      .where(and(eq(members.chapterId, chapterId), eq(members.status, "active"))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(crmVisitors)
      .where(
        and(
          eq(crmVisitors.chapterId, chapterId),
          isNull(crmVisitors.archivedAt),
        ),
      ),
  ]);

  const liveTyfcb = isTyfcbDisplayEnabled(settings)
    ? getTyfcbAmount(settings)
    : null;

  return {
    constants: {
      ...DEFAULT_CONSTANTS,
      // A chapter with no members would divide by zero in the TYFCB-per-head
      // step, so the workshop's figure stands in rather than breaking.
      membersToday: memberRow?.count || DEFAULT_CONSTANTS.membersToday,
      tyfcbLast12Months: liveTyfcb ?? DEFAULT_CONSTANTS.tyfcbLast12Months,
    },
    pipelineCount: visitorRow?.count ?? 0,
  };
}
