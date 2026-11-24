/**
 * Archiving, restoring, deleting, and importing a spreadsheet.
 *
 * Everything here runs against a throwaway chapter that is created and
 * dropped inside this script, and the real chapter's row counts are taken
 * before and after and compared. Local dev points at the production
 * database, so "the test cleaned up after itself" is something to prove
 * rather than assume.
 */
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "../src/db";
import {
  chapters,
  crmNotes,
  crmReminders,
  crmVisitors,
  members,
} from "../src/db/schema";
import { planImport, runImport } from "../src/lib/crm/import";
import { getChapterReport } from "../src/lib/crm/reports";
import { findDueReminders } from "../src/lib/crm/reminders";
import {
  archiveVisitor,
  claimVisitor,
  countPipeline,
  deleteVisitor,
  findPossibleDuplicates,
  listPipeline,
  listTimeline,
  restoreVisitor,
} from "../src/lib/crm/visitors";
import { normaliseText } from "../src/lib/workshop/normalise";

let pass = 0, fail = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label} ${detail}`); }
}

async function realCounts() {
  const [row] = await db.execute(sql`
    select (select count(*)::int from chapters) c,
           (select count(*)::int from crm_visitors) v,
           (select count(*)::int from crm_notes) n,
           (select count(*)::int from members) m
  `).then((r) => (Array.isArray(r) ? r : (r as { rows: unknown[] }).rows)) as Record<string, number>[];
  return row!;
}

async function main() {
  const before = await realCounts();
  console.log("BEFORE", JSON.stringify(before));

  const slug = `test-archive-${Date.now()}`;
  const [chapter] = await db
    .insert(chapters)
    .values({ name: "Throwaway Archive Test", slug })
    .returning();
  const chapterId = chapter!.id;

  const [member] = await db
    .insert(members)
    .values({
      chapterId,
      firstName: "Test",
      lastName: "Member",
      company: "Test Co",
      bniSeat: "Tester",
      phone: "00000 000000",
      email: `${slug}@example.test`,
      status: "active",
      slug: `${slug}-member`,
    })
    .returning();
  const memberId = member!.id;

  async function addVisitor(name: string, company: string) {
    const [row] = await db
      .insert(crmVisitors)
      .values({
        chapterId,
        name,
        company,
        nameKey: normaliseText(name),
        companyKey: normaliseText(company),
      })
      .returning();
    return row!;
  }

  try {
    // ---------------------------------------------------------------
    console.log("\nArchiving takes somebody off the board");
    const jane = await addVisitor("Jane Fletcher", "Fletcher Plumbing");
    const bob = await addVisitor("Bob Smith", "Smith Joinery");

    let live = await listPipeline(chapterId);
    check("both start on the board", live.length === 2);

    const archived = await archiveVisitor(chapterId, jane.id, memberId, "Test Member", "Joined another chapter");
    check("archiving succeeds", archived.ok);

    live = await listPipeline(chapterId);
    check("the board now shows one", live.length === 1, String(live.length));
    check("and it is the right one", live[0]?.id === bob.id);

    const archivedList = await listPipeline(chapterId, { archived: true });
    check("the archive shows the other", archivedList.length === 1);
    check("with an archived date", archivedList[0]?.archivedAt !== null);

    const counts = await countPipeline(chapterId, memberId);
    check("counts exclude archived", counts.all === 1, String(counts.all));
    check("and count the archive separately", counts.archived === 1);

    // ---------------------------------------------------------------
    console.log("\nArchiving is honest about what it did");
    const timeline = await listTimeline(chapterId, jane.id);
    check("the timeline records it",
      timeline.some((entry) => entry.body.includes("archived them")));
    check("including the reason given",
      timeline.some((entry) => entry.body.includes("Joined another chapter")));
    check("archiving twice is not an error",
      (await archiveVisitor(chapterId, jane.id, memberId, "Test Member")).ok);
    const afterTwice = await listTimeline(chapterId, jane.id);
    check("and does not write a second entry",
      afterTwice.length === timeline.length, String(afterTwice.length));

    // ---------------------------------------------------------------
    console.log("\nA claim does not survive archiving");
    const claimed = await addVisitor("Claire Holt", "Holt Signs");
    await claimVisitor(chapterId, claimed.id, memberId, "Test Member");
    let mine = await countPipeline(chapterId, memberId);
    check("the claim counts while live", mine.mine === 1, String(mine.mine));
    await archiveVisitor(chapterId, claimed.id, memberId, "Test Member");
    mine = await countPipeline(chapterId, memberId);
    // Otherwise a member carries a claim on somebody they can no longer see.
    check("archiving releases the claim", mine.mine === 0, String(mine.mine));

    // ---------------------------------------------------------------
    console.log("\nArchived people are out of the reports and the reminders");
    const report = await getChapterReport(chapterId);
    check("the report counts only live visitors",
      report.totals.all === 1, String(report.totals.all));
    check("and no longer credits the released claim",
      report.claimedVisitors.every((v) => v.id !== claimed.id));

    // The cron must never email somebody about an archived visitor.
    const due = await findDueReminders(new Date(Date.now() + 1000 * 60 * 60 * 24 * 90));
    check("the reminder cron skips archived visitors",
      due.every((row) => row.visitorId !== claimed.id && row.visitorId !== jane.id));

    // ---------------------------------------------------------------
    console.log("\nBut they still raise a duplicate warning");
    const dupes = await findPossibleDuplicates(chapterId, {
      name: "Jane Fletcher",
      company: "Fletcher Plumbing",
    });
    // Hiding archived matches would make the archive a way to forget that
    // somebody already said no.
    check("an archived person is still matched",
      dupes.some((d) => d.id === jane.id), JSON.stringify(dupes));
    check("and is labelled as archived",
      dupes.find((d) => d.id === jane.id)?.archived === true);

    // ---------------------------------------------------------------
    console.log("\nRestoring puts them back");
    const restored = await restoreVisitor(chapterId, jane.id, memberId, "Test Member");
    check("restoring succeeds", restored.ok);
    live = await listPipeline(chapterId);
    check("the board has them again", live.some((v) => v.id === jane.id));
    check("the archive no longer does",
      (await listPipeline(chapterId, { archived: true })).every((v) => v.id !== jane.id));
    check("the history of the archiving is kept",
      (await listTimeline(chapterId, jane.id)).some((e) => e.body.includes("archived them")));
    check("restoring something live is refused",
      !(await restoreVisitor(chapterId, jane.id, memberId, "Test Member")).ok);

    // ---------------------------------------------------------------
    console.log("\nDeleting takes the record with it");
    await db.insert(crmNotes).values({
      chapterId, visitorId: bob.id, kind: "note", body: "a note that should go too",
    });
    await db.insert(crmReminders).values({
      chapterId, visitorId: bob.id, memberId, attempt: 1,
      dueAt: new Date(), tokenHash: `test-${Date.now()}`,
      tokenExpiresAt: new Date(Date.now() + 1000),
    });
    const notesBefore = await db.select({ n: sql<number>`count(*)::int` })
      .from(crmNotes).where(eq(crmNotes.visitorId, bob.id));
    check("the note is there first", (notesBefore[0]?.n ?? 0) > 0);

    const deleted = await deleteVisitor(chapterId, bob.id);
    check("deleting succeeds", deleted.ok);
    check("it returns the name for the confirmation message",
      deleted.ok && deleted.data.name === "Bob Smith");

    const notesAfter = await db.select({ n: sql<number>`count(*)::int` })
      .from(crmNotes).where(eq(crmNotes.visitorId, bob.id));
    check("the notes cascaded away", (notesAfter[0]?.n ?? 0) === 0);
    const remindersAfter = await db.select({ n: sql<number>`count(*)::int` })
      .from(crmReminders).where(eq(crmReminders.visitorId, bob.id));
    check("so did the reminders", (remindersAfter[0]?.n ?? 0) === 0);
    check("deleting again is refused", !(await deleteVisitor(chapterId, bob.id)).ok);

    // ---------------------------------------------------------------
    console.log("\nAnother chapter cannot reach any of it");
    const [other] = await db.insert(chapters)
      .values({ name: "Other", slug: `${slug}-other` }).returning();
    const otherId = other!.id;
    try {
      check("cannot archive across chapters",
        !(await archiveVisitor(otherId, jane.id, memberId, "Test Member")).ok);
      check("cannot restore across chapters",
        !(await restoreVisitor(otherId, jane.id, memberId, "Test Member")).ok);
      check("cannot delete across chapters",
        !(await deleteVisitor(otherId, jane.id)).ok);
      check("and the visitor is still there afterwards",
        (await listPipeline(chapterId)).some((v) => v.id === jane.id));
    } finally {
      await db.delete(chapters).where(eq(chapters.id, otherId));
    }

    // ---------------------------------------------------------------
    console.log("\nImporting a spreadsheet: the plan");
    const csv = [
      "Name,Business Name,Trade,Mobile,E-mail Address,Notes",
      'Amara Okafor,"Okafor, Reed & Co",Solicitor,07700 900001,amara@okafor.test,Met at the show',
      "Tom Vance,Vance Roofing,Roofer,07700 900002,tom@vance.test,",
      ",No Name Ltd,Plumber,07700 900003,,",
      "Amara Okafor,\"Okafor, Reed & Co\",Solicitor,,,duplicate inside the file",
      "Jane Fletcher,Fletcher Plumbing,Plumber,,,already in the chapter",
      "Dee Mallory,Mallory Media,Marketing,07700 900004,not-an-email,",
    ].join("\n");

    const planned = await planImport(chapterId, csv);
    check("the plan is produced", planned.ok);
    if (planned.ok) {
      const plan = planned.data;
      const byLine = (n: number) => plan.rows.find((r) => r.line === n)!;
      check("six rows read", plan.rows.length === 6, String(plan.rows.length));
      check("the quoted comma survived into the plan",
        byLine(1).company === "Okafor, Reed & Co", String(byLine(1).company));
      check("a row with no name is skipped", byLine(3).action === "skip");
      check("and says why", byLine(3).problem === "No name.");
      check("a repeat inside the file is skipped", byLine(4).action === "skip");
      check("naming the earlier row",
        byLine(4).problem?.includes("row 1") === true, String(byLine(4).problem));
      check("somebody already in the chapter is flagged, not skipped",
        byLine(5).action === "add" && byLine(5).duplicateOf !== null,
        String(byLine(5).duplicateOf));
      check("a bad email is dropped but the row is kept",
        byLine(6).action === "add" && byLine(6).email === null);
      check("and it says so", byLine(6).problem?.includes("not an email") === true);
      check("nothing was written by planning",
        (await listPipeline(chapterId)).length === 1,
        String((await listPipeline(chapterId)).length));
    }

    // ---------------------------------------------------------------
    console.log("\nImporting a spreadsheet: the run");
    const ran = await runImport(chapterId, memberId, "Test Member", csv, {
      skipDuplicates: true,
    });
    check("the import runs", ran.ok);
    check("three people added", ran.ok && ran.data.added === 3, ran.ok ? String(ran.data.added) : "");

    const afterImport = await listPipeline(chapterId);
    check("the board grew by three", afterImport.length === 4, String(afterImport.length));
    const amara = afterImport.find((v) => v.name === "Amara Okafor");
    check("the quoted company was stored whole",
      amara?.company === "Okafor, Reed & Co", String(amara?.company));
    check("the trade came across", amara?.category === "Solicitor");
    check("imported people are unclaimed", afterImport.every((v) =>
      v.name === "Jane Fletcher" || v.ownerMemberId === null));
    check("the duplicate was skipped",
      afterImport.filter((v) => v.name === "Jane Fletcher").length === 1);

    const amaraTimeline = await listTimeline(chapterId, amara!.id);
    check("each import gets a timeline entry",
      amaraTimeline.some((e) => e.body.includes("imported this one from a spreadsheet")));
    check("and the notes column becomes a note",
      amaraTimeline.some((e) => e.kind === "note" && e.body === "Met at the show"));

    // Unticking the box is the member overriding the warning on purpose.
    const again = await runImport(chapterId, memberId, "Test Member", csv, {
      skipDuplicates: false,
    });
    check("importing the same file again, duplicates allowed, adds them", again.ok);
    check("including the one it skipped before",
      (await listPipeline(chapterId)).filter((v) => v.name === "Jane Fletcher").length === 2);

    check("a file of nothing but duplicates, all skipped, is refused",
      !(await runImport(chapterId, memberId, "Test Member",
        "Name,Company\nJane Fletcher,Fletcher Plumbing", { skipDuplicates: true })).ok);

    // ---------------------------------------------------------------
    console.log("\nImport cannot cross a chapter boundary");
    const [third] = await db.insert(chapters)
      .values({ name: "Third", slug: `${slug}-third` }).returning();
    try {
      const otherPlan = await planImport(third!.id, csv);
      check("the other chapter sees no duplicates of ours",
        otherPlan.ok && otherPlan.data.duplicates === 0,
        otherPlan.ok ? String(otherPlan.data.duplicates) : "");
    } finally {
      await db.delete(chapters).where(eq(chapters.id, third!.id));
    }

    // ---------------------------------------------------------------
    console.log("\nThe partial index the board relies on");
    const liveOnly = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(crmVisitors)
      .where(and(eq(crmVisitors.chapterId, chapterId), isNull(crmVisitors.archivedAt)));
    check("live rows are countable by the archived_at predicate",
      (liveOnly[0]?.n ?? 0) === (await listPipeline(chapterId)).length);
  } finally {
    // chapters cascade to members, visitors, notes and reminders.
    await db.delete(chapters).where(eq(chapters.id, chapterId));
    console.log("\nThrowaway chapter deleted.");
  }

  const after = await realCounts();
  console.log("AFTER ", JSON.stringify(after));
  check("the real chapter is untouched",
    before.c === after.c && before.v === after.v &&
    before.n === after.n && before.m === after.m,
    `${JSON.stringify(before)} vs ${JSON.stringify(after)}`);

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
