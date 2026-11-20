/**
 * Copy a finished workshop's contacts into the CRM pipeline.
 *
 * Usage:
 *   npm run crm:promote -- <sessionId>        # report only, writes nothing
 *   npm run crm:promote -- <sessionId> --go   # do it
 *
 * Idempotent: running it again picks up only contacts added since.
 */
import { and, eq, sql } from "drizzle-orm";
import { db } from "../src/db";
import { crmVisitors, workshopContacts, workshopSessions } from "../src/db/schema";
import { getDefaultChapterId } from "../src/lib/chapters";
import { promoteWorkshopSession } from "../src/lib/crm/visitors";

const sessionId = process.argv[2];
const go = process.argv.includes("--go");

async function main() {
  const chapterId = await getDefaultChapterId();

  if (!sessionId) {
    const sessions = await db
      .select({
        id: workshopSessions.id,
        createdAt: workshopSessions.createdAt,
        isLive: workshopSessions.isLive,
        state: workshopSessions.state,
        contacts: sql<number>`(
          select count(*)::int from workshop_contacts
          where workshop_contacts.session_id = workshop_sessions.id
        )`,
        promoted: sql<number>`(
          select count(*)::int from crm_visitors
          where crm_visitors.source_workshop_session_id = workshop_sessions.id
        )`,
      })
      .from(workshopSessions)
      .where(eq(workshopSessions.chapterId, chapterId));

    console.log("Sessions in this chapter:\n");
    for (const s of sessions) {
      console.log(
        `  ${s.id}  ${s.createdAt.toISOString().slice(0, 16)}  live=${s.isLive}  state=${s.state}  contacts=${s.contacts}  already promoted=${s.promoted}`,
      );
    }
    console.log("\nPass a session id to promote it.");
    return;
  }

  const session = await db.query.workshopSessions.findFirst({
    where: and(
      eq(workshopSessions.id, sessionId),
      eq(workshopSessions.chapterId, chapterId),
    ),
  });
  if (!session) {
    console.error(`No session ${sessionId} in this chapter.`);
    process.exit(1);
  }

  const [counts] = await db
    .select({
      contacts: sql<number>`count(*)::int`,
      claimed: sql<number>`count(${workshopContacts.claimedByKey})::int`,
      invited: sql<number>`count(${workshopContacts.invitedAt})::int`,
      noted: sql<number>`count(nullif(trim(coalesce(${workshopContacts.notes}, '')), ''))::int`,
    })
    .from(workshopContacts)
    .where(eq(workshopContacts.sessionId, sessionId));

  const [already] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(crmVisitors)
    .where(eq(crmVisitors.sourceWorkshopSessionId, sessionId));

  console.log(`Session   ${sessionId}`);
  console.log(`Created   ${session.createdAt.toISOString()}`);
  console.log(`Contacts  ${counts?.contacts ?? 0}`);
  console.log(`  claimed ${counts?.claimed ?? 0}`);
  console.log(`  invited ${counts?.invited ?? 0}`);
  console.log(`  notes   ${counts?.noted ?? 0}`);
  console.log(`Already in the pipeline from this session: ${already?.n ?? 0}`);

  if (!go) {
    console.log("\nReport only. Re-run with --go to write.");
    return;
  }

  const summary = await promoteWorkshopSession(chapterId, sessionId);
  console.log(`\nAdded ${summary.added}, skipped ${summary.skipped} (already there).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
