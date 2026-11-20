/**
 * Throwaway-chapter tests for the reminder engine.
 *
 * Everything is created under a chapter whose slug nobody would mistake for
 * real, and deleted again. Real-row counts are taken before and after and
 * compared, because this runs against the live database.
 */
import { and, eq, sql } from "drizzle-orm";
import { db } from "../src/db";
import { chapters, crmNotes, crmReminders, crmVisitors, members } from "../src/db/schema";
import {
  MAX_ATTEMPTS,
  answerNo,
  answerYes,
  markInvitedFromReminder,
  findDueReminders,
  releaseFromReminder,
  resolveReminderToken,
  undoYes,
} from "../src/lib/crm/reminders";
import { createReminderToken, hashToken, looksLikeToken } from "../src/lib/crm/tokens";

const SLUG = "zz-reminder-test-delete-me";
const DAY = 86_400_000;
const now = new Date();
const ago = (d: number) => new Date(now.getTime() - d * DAY);

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label} ${detail}`); }
}

async function realCounts() {
  const r = await db.execute(sql`
    select
      (select count(*)::int from crm_visitors v join chapters c on c.id = v.chapter_id where c.slug <> ${SLUG}) as visitors,
      (select count(*)::int from crm_notes n join chapters c on c.id = n.chapter_id where c.slug <> ${SLUG}) as notes,
      (select count(*)::int from crm_reminders r2 join chapters c on c.id = r2.chapter_id where c.slug <> ${SLUG}) as reminders,
      (select count(*)::int from members m join chapters c on c.id = m.chapter_id where c.slug <> ${SLUG}) as members,
      (select count(*)::int from workshop_contacts) as contacts
  `);
  return JSON.stringify((r.rows ?? r)[0]);
}

async function main() {
  const before = await realCounts();
  console.log(`BEFORE ${before}\n`);

  let chapterId: string | undefined;
  try {
    // ---------- tokens ----------
    console.log("Tokens");
    const t = createReminderToken(now);
    check("hash is sha256 hex", /^[0-9a-f]{64}$/.test(t.tokenHash));
    check("hash matches the raw token", hashToken(t.token) === t.tokenHash);
    check("raw token is not the hash", t.token !== t.tokenHash);
    check("two tokens differ", createReminderToken().token !== createReminderToken().token);
    check("expiry is 21 days out", Math.round((t.expiresAt.getTime() - now.getTime()) / DAY) === 21);
    check("shape check accepts a real token", looksLikeToken(t.token));
    for (const junk of ["", "short", "../../etc/passwd", "a".repeat(200), "has spaces in it!!"]) {
      check(`shape check rejects ${JSON.stringify(junk.slice(0, 18))}`, !looksLikeToken(junk));
    }
    check("a junk token resolves to nothing", (await resolveReminderToken("not-a-token")) === null);

    // ---------- fixtures ----------
    const [chapter] = await db.insert(chapters).values({ name: "ZZ Reminder Test", slug: SLUG }).returning();
    chapterId = chapter!.id;

    const [owner] = await db.insert(members).values({
      chapterId, firstName: "Zed", lastName: "Tester", company: "ZZ", bniSeat: "Tester",
      email: "zz-reminder-test@example.invalid", phone: "0",
    }).returning();
    const ownerId = owner!.id;

    async function visitor(name: string, claimedDaysAgo: number | null, stage = "to_invite") {
      const [v] = await db.insert(crmVisitors).values({
        chapterId: chapterId!, name, nameKey: name.toLowerCase(), companyKey: "",
        company: "ZZ Ltd",
        stage: stage as never,
        ownerMemberId: claimedDaysAgo === null ? null : ownerId,
        ownerClaimedAt: claimedDaysAgo === null ? null : ago(claimedDaysAgo),
      }).returning();
      return v!.id;
    }

    const overdue = await visitor("Overdue Olive", 9);
    const fresh = await visitor("Fresh Fred", 3);
    const unclaimed = await visitor("Unclaimed Una", null);
    await visitor("Invited Ida", 20, "invited");
    const capped = await visitor("Capped Carl", 40);

    // Carl has had his four.
    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      await db.insert(crmReminders).values({
        chapterId, visitorId: capped, memberId: ownerId, attempt: i,
        dueAt: ago(40 - i * 7), sentAt: ago(40 - i * 7),
        tokenHash: hashToken(`capped-${i}-${Date.now()}`), tokenExpiresAt: new Date(now.getTime() + 21 * DAY),
      });
    }

    // ---------- who is due ----------
    console.log("\nWho is due");
    const due = await findDueReminders(now);
    const mine = due.filter((d) => d.chapterId === chapterId);
    const names = mine.map((d) => d.visitorName);
    check("claimed 9 days ago is due", names.includes("Overdue Olive"));
    check("claimed 3 days ago is not", !names.includes("Fresh Fred"));
    check("unclaimed is not", !names.includes("Unclaimed Una"));
    check("already invited is not", !names.includes("Invited Ida"));
    check(`${MAX_ATTEMPTS} nudges already sent is not`, !names.includes("Capped Carl"));
    const olive = mine.find((d) => d.visitorName === "Overdue Olive")!;
    check("first nudge is attempt 1", olive.attempt === 1, `got ${olive?.attempt}`);
    check("reason explains itself", /claimed 9 days ago, never nudged/.test(olive.reason), olive.reason);
    check("company rides along for the email", olive.visitorCompany === "ZZ Ltd");
    check("email is the owner's", olive.memberEmail === "zz-reminder-test@example.invalid");

    // A nudge sent two days ago holds the next one off.
    await db.insert(crmReminders).values({
      chapterId, visitorId: overdue, memberId: ownerId, attempt: 1,
      dueAt: ago(2), sentAt: ago(2),
      tokenHash: hashToken(`recent-${Date.now()}`), tokenExpiresAt: new Date(now.getTime() + 21 * DAY),
    });
    const after1 = (await findDueReminders(now)).filter((d) => d.chapterId === chapterId);
    check("a nudge 2 days ago holds the next off", !after1.some((d) => d.visitorName === "Overdue Olive"));

    // Backdate it eight days and she is due again, as attempt 2.
    await db.update(crmReminders)
      .set({ sentAt: ago(8), dueAt: ago(8) })
      .where(and(eq(crmReminders.visitorId, overdue), eq(crmReminders.attempt, 1)));
    const after2 = (await findDueReminders(now)).filter((d) => d.visitorName === "Overdue Olive");
    check("8 days later she is due again", after2.length === 1);
    check("and it is attempt 2", after2[0]?.attempt === 2, `got ${after2[0]?.attempt}`);
    check("reason reflects the last nudge", /last nudge 8 days ago/.test(after2[0]?.reason ?? ""));

    // ---------- answering ----------
    console.log("\nAnswering");
    const live = createReminderToken(now);
    const [rem] = await db.insert(crmReminders).values({
      chapterId, visitorId: fresh, memberId: ownerId, attempt: 1,
      dueAt: now, sentAt: now, tokenHash: live.tokenHash, tokenExpiresAt: live.expiresAt,
    }).returning();

    const resolved = await resolveReminderToken(live.token);
    check("a live token resolves", Boolean(resolved));
    check("resolves to the right visitor", resolved?.visitorName === "Fresh Fred");
    check("and knows it is still theirs", resolved?.stillOwned === true);
    check("a one-character change resolves to nothing",
      (await resolveReminderToken(live.token.slice(0, -1) + (live.token.endsWith("A") ? "B" : "A"))) === null);

    await answerYes(resolved!);
    const yes1 = await db.query.crmVisitors.findFirst({ where: eq(crmVisitors.id, fresh) });
    check("yes moves them to invited", yes1?.stage === "invited", yes1?.stage);
    check("yes stamps the invite date", Boolean(yes1?.invitedAt));
    const answered = await db.query.crmReminders.findFirst({ where: eq(crmReminders.id, rem!.id) });
    check("the answer is recorded", answered?.answer === "yes");

    // A prefetcher following the link twice must not write twice.
    await answerYes((await resolveReminderToken(live.token))!);
    const entries = await db.select().from(crmNotes)
      .where(and(eq(crmNotes.visitorId, fresh), eq(crmNotes.kind, "reminder_answered")));
    check("clicking yes twice writes one timeline entry", entries.length === 1, `got ${entries.length}`);

    const stages = await db.select().from(crmNotes)
      .where(and(eq(crmNotes.visitorId, fresh), eq(crmNotes.kind, "stage_change")));
    check("and moves them once", stages.length === 1, `got ${stages.length}`);
    check("an invited visitor drops out of the due list",
      !(await findDueReminders(now)).some((d) => d.visitorName === "Fresh Fred"));

    await undoYes((await resolveReminderToken(live.token))!);
    const undone = await db.query.crmVisitors.findFirst({ where: eq(crmVisitors.id, fresh) });
    check("undo puts them back", undone?.stage === "to_invite", undone?.stage);
    check("undo clears the invite date", undone?.invitedAt === null);

    // The page that renders after an undo calls answerYes again. If that
    // re-marked them, the undo would silently fail -- which it did, once.
    const afterUndo = (await resolveReminderToken(live.token))!;
    check("undo is recorded as an answer", afterUndo.alreadyAnswered === "no");
    await answerYes(afterUndo);
    const stillBack = await db.query.crmVisitors.findFirst({ where: eq(crmVisitors.id, fresh) });
    check("a re-render after undo does not re-mark them", stillBack?.stage === "to_invite", stillBack?.stage);
    check("he is not nudged again the same day",
      !(await findDueReminders(now)).some((d) => d.visitorName === "Fresh Fred"));
    await db.update(crmReminders).set({ sentAt: ago(8) }).where(eq(crmReminders.id, rem!.id));
    check("but he rejoins the weekly cycle",
      (await findDueReminders(now)).some((d) => d.visitorName === "Fresh Fred"));
    await db.update(crmReminders).set({ sentAt: now }).where(eq(crmReminders.id, rem!.id));

    // The Not yet page's correction button has to beat that same guard.
    await markInvitedFromReminder((await resolveReminderToken(live.token))!);
    const corrected = await db.query.crmVisitors.findFirst({ where: eq(crmVisitors.id, fresh) });
    check("'actually I've sent it' still works after an undo", corrected?.stage === "invited", corrected?.stage);

    // ---------- not yet, and release ----------
    console.log("\nNot yet, and release");
    const noTok = createReminderToken(now);
    await db.insert(crmReminders).values({
      chapterId, visitorId: capped, memberId: ownerId, attempt: 4,
      dueAt: now, sentAt: now, tokenHash: noTok.tokenHash, tokenExpiresAt: noTok.expiresAt,
    });
    const noRes = (await resolveReminderToken(noTok.token))!;
    await answerNo(noRes);
    const stillOurs = await db.query.crmVisitors.findFirst({ where: eq(crmVisitors.id, capped) });
    check("no leaves them where they are", stillOurs?.stage === "to_invite");
    check("no leaves them claimed", stillOurs?.ownerMemberId === ownerId);

    await releaseFromReminder(noRes);
    const freed = await db.query.crmVisitors.findFirst({ where: eq(crmVisitors.id, capped) });
    check("release hands them back", freed?.ownerMemberId === null);
    const history = await db.select().from(crmNotes).where(eq(crmNotes.visitorId, capped));
    check("and the history survives the release", history.length >= 2, `${history.length} entries`);
    check("a released visitor is not nudged",
      !(await findDueReminders(now)).some((d) => d.visitorName === "Capped Carl"));

    // ---------- expiry ----------
    console.log("\nExpiry");
    const old = createReminderToken(now);
    await db.insert(crmReminders).values({
      chapterId, visitorId: unclaimed, memberId: ownerId, attempt: 1,
      dueAt: ago(30), sentAt: ago(30), tokenHash: old.tokenHash, tokenExpiresAt: ago(1),
    });
    check("an expired token resolves to nothing", (await resolveReminderToken(old.token)) === null);
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
