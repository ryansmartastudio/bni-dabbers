/**
 * The admin report's aggregates, against a throwaway chapter with figures
 * worked out by hand. Real rows are counted before and after and compared.
 */
import { eq, sql } from "drizzle-orm";
import { db } from "../src/db";
import { chapters, crmNotes, crmReminders, crmVisitors, members } from "../src/db/schema";
import { getChapterReport } from "../src/lib/crm/reports";
import { getDefaultChapterId } from "../src/lib/chapters";
import { hashToken } from "../src/lib/crm/tokens";

const SLUG = "zz-report-test-delete-me";
const DAY = 86_400_000;
const ago = (d: number) => new Date(Date.now() - d * DAY);

let pass = 0, fail = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label} ${detail}`); }
}

async function realCounts() {
  const r = await db.execute(sql`
    select (select count(*)::int from crm_visitors) v,
           (select count(*)::int from crm_notes) n,
           (select count(*)::int from members) m,
           (select count(*)::int from chapters) c`);
  return JSON.stringify((r.rows ?? r)[0]);
}

async function main() {
  const before = await realCounts();
  console.log(`BEFORE ${before}\n`);

  let chapterId: string | undefined;
  try {
    const [chapter] = await db.insert(chapters)
      .values({ name: "ZZ Report Test", slug: SLUG }).returning();
    chapterId = chapter!.id;

    const mk = async (first: string) => {
      const [m] = await db.insert(members).values({
        chapterId: chapterId!, firstName: first, lastName: "Tester", company: "ZZ",
        bniSeat: "Tester", email: `zz-report-${first.toLowerCase()}@example.invalid`, phone: "0",
      }).returning();
      return m!.id;
    };
    const ann = await mk("Ann");
    const bob = await mk("Bob");

    const visitor = async (name: string, owner: string | null, stage: string, claimedDays = 2) => {
      const [v] = await db.insert(crmVisitors).values({
        chapterId: chapterId!, name, nameKey: name.toLowerCase(), companyKey: "",
        stage: stage as never,
        ownerMemberId: owner,
        ownerClaimedAt: owner ? ago(claimedDays) : null,
        invitedAt: ["invited", "visit_booked", "visited", "joined"].includes(stage) ? ago(1) : null,
      }).returning();
      return v!.id;
    };

    // Ann: 3 claimed (1 still to invite and stale at 20 days, 1 invited, 1 joined)
    const annStale = await visitor("Ann Stale", ann, "to_invite", 20);
    await visitor("Ann Invited", ann, "invited");
    await visitor("Ann Joined", ann, "joined");
    // Bob: 2 claimed (1 to invite, fresh; 1 not now)
    await visitor("Bob Fresh", bob, "to_invite", 2);
    await visitor("Bob Nope", bob, "not_now");
    // Nobody: 4 unclaimed
    for (let i = 1; i <= 4; i++) await visitor(`Spare ${i}`, null, "to_invite");

    await db.insert(crmNotes).values({
      chapterId, visitorId: annStale, authorMemberId: ann, kind: "note",
      body: "Rang him, no answer",
    });
    await db.insert(crmReminders).values([
      { chapterId, visitorId: annStale, memberId: ann, attempt: 1, dueAt: ago(10),
        sentAt: ago(10), answer: "yes", answeredAt: ago(9),
        tokenHash: hashToken(`r1-${Date.now()}`), tokenExpiresAt: new Date(Date.now() + 21 * DAY) },
      { chapterId, visitorId: annStale, memberId: ann, attempt: 2, dueAt: ago(3),
        sentAt: ago(3),
        tokenHash: hashToken(`r2-${Date.now()}`), tokenExpiresAt: new Date(Date.now() + 21 * DAY) },
    ]);

    const report = await getChapterReport(chapterId);

    console.log("Totals");
    check("counts every visitor", report.totals.all === 9, `${report.totals.all}`);
    check("counts the claimed", report.totals.claimed === 5, `${report.totals.claimed}`);
    check("counts the unclaimed", report.totals.unclaimed === 4, `${report.totals.unclaimed}`);
    check("splits by stage", report.totals.byStage.to_invite === 6, `to_invite=${report.totals.byStage.to_invite}`);
    check("counts the joined", report.totals.byStage.joined === 1);
    check("counts not now", report.totals.byStage.not_now === 1);

    console.log("\nBy member");
    check("only members holding somebody appear", report.members.length === 2, `${report.members.length}`);
    const annRow = report.members.find((m) => m.name.startsWith("Ann"))!;
    const bobRow = report.members.find((m) => m.name.startsWith("Bob"))!;
    check("busiest member first", report.members[0]?.name.startsWith("Ann") === true);
    check("Ann holds three", annRow.claimed === 3, `${annRow.claimed}`);
    check("one of Ann's is still to invite", annRow.stillToInvite === 1, `${annRow.stillToInvite}`);
    check("one of Ann's is invited", annRow.invited === 1);
    check("one of Ann's has joined", annRow.joined === 1);
    check("Ann's oldest open claim is 20 days", annRow.waitingLongest === 20, `${annRow.waitingLongest}`);
    check("Bob holds two", bobRow.claimed === 2);
    check("Bob has nothing overdue beyond two days", bobRow.waitingLongest === 2, `${bobRow.waitingLongest}`);

    console.log("\nWho has whom");
    check("lists every claimed visitor", report.claimedVisitors.length === 5, `${report.claimedVisitors.length}`);
    check("and nobody unclaimed", !report.claimedVisitors.some((v) => !v.ownerMemberId));
    check("each carries its owner's name", report.claimedVisitors.every((v) => Boolean(v.ownerName)));

    console.log("\nNeeds chasing");
    check("only the overdue one", report.stale.length === 1, `${report.stale.length}`);
    check("and it is the right one", report.stale[0]?.name === "Ann Stale", report.stale[0]?.name);
    check("fresh claims are not chased", !report.stale.some((v) => v.name === "Bob Fresh"));
    check("invited visitors are not chased", !report.stale.some((v) => v.stage !== "to_invite"));

    console.log("\nActivity and reminders");
    check("the note shows up", report.activity.some((a) => a.body === "Rang him, no answer"));
    check("activity names the visitor", report.activity[0]?.visitorName === "Ann Stale", report.activity[0]?.visitorName);
    check("counts reminders sent", report.reminders.sent === 2, `${report.reminders.sent}`);
    check("counts the yes", report.reminders.yes === 1);
    check("counts the unanswered", report.reminders.unanswered === 1);

    console.log("\nTenancy");
    const other = await getChapterReport(await getDefaultChapterId());
    check("the real chapter's report excludes this one",
      !other.claimedVisitors.some((v) => v.name.startsWith("Ann ")));
    check("and counts only its own", other.totals.all === 107, `${other.totals.all}`);
  } finally {
    if (chapterId) {
      await db.delete(chapters).where(eq(chapters.id, chapterId));
      console.log("\nThrowaway chapter deleted.");
    }
  }

  const after = await realCounts();
  console.log(`AFTER  ${after}`);
  check("real data is untouched", before === after, `${before} -> ${after}`);
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
