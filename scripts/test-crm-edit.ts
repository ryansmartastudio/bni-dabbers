/**
 * Editing a visitor's details: what changes, what the timeline records, and
 * that the dedupe keys move with the fields behind them.
 */
import { eq, sql } from "drizzle-orm";
import { db } from "../src/db";
import { chapters, crmNotes, crmVisitors, members } from "../src/db/schema";
import {
  findPossibleDuplicates,
  listTimeline,
  updateVisitorDetails,
} from "../src/lib/crm/visitors";

const SLUG = "zz-edit-test-delete-me";

let pass = 0, fail = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label} ${detail}`); }
}

async function realCounts() {
  const r = await db.execute(sql`
    select (select count(*)::int from crm_visitors) v,
           (select count(*)::int from crm_notes) n,
           (select count(*)::int from members) m`);
  return JSON.stringify((r.rows ?? r)[0]);
}

async function main() {
  const before = await realCounts();
  console.log(`BEFORE ${before}\n`);

  let chapterId: string | undefined;
  try {
    const [chapter] = await db.insert(chapters)
      .values({ name: "ZZ Edit Test", slug: SLUG }).returning();
    chapterId = chapter!.id;
    const [me] = await db.insert(members).values({
      chapterId, firstName: "Ed", lastName: "Itor", company: "ZZ",
      bniSeat: "Tester", email: "zz-edit@example.invalid", phone: "0",
    }).returning();
    const [other] = await db.insert(members).values({
      chapterId, firstName: "Ada", lastName: "Other", company: "ZZ",
      bniSeat: "Tester", email: "zz-edit2@example.invalid", phone: "0",
    }).returning();

    const [v] = await db.insert(crmVisitors).values({
      chapterId, name: "Dave Mason", company: "Mason Plumbing",
      category: "Plumber", phone: "0161 111 2222", email: "dave@mason.test",
      nameKey: "dave mason", companyKey: "mason plumbing",
      phoneKey: "01611112222", emailKey: "dave@mason.test",
      // Claimed by somebody else, to prove editing is not the claimant's alone.
      ownerMemberId: other!.id, ownerClaimedAt: new Date(),
    }).returning();
    const id = v!.id;
    const edit = (edits: Parameters<typeof updateVisitorDetails>[4]) =>
      updateVisitorDetails(chapterId!, id, me!.id, "Ed Itor", edits);

    console.log("Editing");
    const r1 = await edit({ phone: "0161 333 4444" });
    check("a member who did not claim them can edit", r1.ok);
    const after1 = await db.query.crmVisitors.findFirst({ where: eq(crmVisitors.id, id) });
    check("the new number is stored", after1?.phone === "0161 333 4444", after1?.phone ?? "");
    check("the phone key moves with it", after1?.phoneKey === "01613334444", after1?.phoneKey ?? "");
    check("the owner is untouched", after1?.ownerMemberId === other!.id);

    await edit({ email: "DAVE@Mason.TEST " });
    const after2 = await db.query.crmVisitors.findFirst({ where: eq(crmVisitors.id, id) });
    check("the email key is normalised", after2?.emailKey === "dave@mason.test", after2?.emailKey ?? "");

    await edit({ name: "David Mason", company: "Mason & Sons" });
    const after3 = await db.query.crmVisitors.findFirst({ where: eq(crmVisitors.id, id) });
    check("the name key moves with the name", after3?.nameKey === "david mason", after3?.nameKey ?? "");
    check("the company key moves too", after3?.companyKey === "mason sons", after3?.companyKey ?? "");

    // The duplicate warning reads those keys, so it has to follow the edit.
    const dupes = await findPossibleDuplicates(chapterId, { name: "David Mason" });
    check("the duplicate warning follows the new name", dupes.some((d) => d.id === id));
    const old = await findPossibleDuplicates(chapterId, { name: "Dave Mason" });
    check("and no longer matches the old one", !old.some((d) => d.id === id));

    console.log("\nTidying and validation");
    await edit({ website: "mason-plumbing.co.uk" });
    const after4 = await db.query.crmVisitors.findFirst({ where: eq(crmVisitors.id, id) });
    check("a bare domain gains a scheme", after4?.website?.startsWith("https://") === true, after4?.website ?? "");

    await edit({ company: "  Mason   and\tSons  " });
    const after5 = await db.query.crmVisitors.findFirst({ where: eq(crmVisitors.id, id) });
    check("whitespace is collapsed", after5?.company === "Mason and Sons", after5?.company ?? "");

    const blank = await edit({ name: "   " });
    check("a blank name is refused", !blank.ok);
    const stillNamed = await db.query.crmVisitors.findFirst({ where: eq(crmVisitors.id, id) });
    check("and nothing was written", stillNamed?.name === "David Mason");

    const badDate = await edit({ visitBookedFor: "next tuesday" });
    check("a nonsense date is refused", !badDate.ok);

    await edit({ visitBookedFor: "2026-12-03" });
    const dated = await db.query.crmVisitors.findFirst({ where: eq(crmVisitors.id, id) });
    check("a real date is stored", String(dated?.visitBookedFor) === "2026-12-03", String(dated?.visitBookedFor));

    await edit({ visitBookedFor: "" });
    const cleared = await db.query.crmVisitors.findFirst({ where: eq(crmVisitors.id, id) });
    check("and can be cleared", cleared?.visitBookedFor === null, String(cleared?.visitBookedFor));

    await edit({ phone: "" });
    const noPhone = await db.query.crmVisitors.findFirst({ where: eq(crmVisitors.id, id) });
    check("clearing a field clears its key too", noPhone?.phone === null && noPhone?.phoneKey === null);

    console.log("\nThe timeline");
    const timeline = await listTimeline(chapterId, id);
    const bodies = timeline.map((t) => t.body);
    // Eight edits changed something; the blank name and the nonsense date
    // were refused, and a save that changes nothing writes nothing.
    check("every edit that changed something is recorded", timeline.length === 8, `${timeline.length}`);
    check("it names who did it", bodies.every((b) => b.startsWith("Ed Itor updated")));
    check("it keeps the old value", bodies.some((b) => b.includes('"0161 111 2222" → "0161 333 4444"')),
      bodies.find((b) => b.includes("Phone")) ?? "");
    check("setting something empty reads as 'set to'", bodies.some((b) => /set to "https:/.test(b)));
    check("clearing reads as 'cleared'", bodies.some((b) => /Phone cleared \(was/.test(b)));

    const noChange = await edit({ company: "Mason and Sons" });
    const after6 = await listTimeline(chapterId, id);
    check("saving without changing anything succeeds", noChange.ok);
    check("and writes no timeline entry", after6.length === timeline.length, `${after6.length} vs ${timeline.length}`);

    console.log("\nTenancy");
    const [otherChapter] = await db.insert(chapters)
      .values({ name: "ZZ Edit Other", slug: `${SLUG}-2` }).returning();
    const crossed = await updateVisitorDetails(
      otherChapter!.id, id, me!.id, "Ed Itor", { phone: "0000" },
    );
    check("a visitor from another chapter cannot be edited", !crossed.ok);
    const untouched = await db.query.crmVisitors.findFirst({ where: eq(crmVisitors.id, id) });
    check("and was not touched", untouched?.phone === null);
    await db.delete(chapters).where(eq(chapters.id, otherChapter!.id));
  } finally {
    if (chapterId) {
      await db.delete(chapters).where(eq(chapters.id, chapterId));
      console.log("\nThrowaway chapters deleted.");
    }
  }

  const after = await realCounts();
  console.log(`AFTER  ${after}`);
  check("real data is untouched", before === after, `${before} -> ${after}`);
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
