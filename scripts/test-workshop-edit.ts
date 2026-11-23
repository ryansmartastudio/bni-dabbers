/**
 * Editing a workshop contact: the dedupe keys must follow the fields, and a
 * collision must say what is actually wrong rather than throwing.
 */
import { eq, sql } from "drizzle-orm";
import { db } from "../src/db";
import { chapters, workshopContacts, workshopSessions } from "../src/db/schema";
import { getDefaultChapterId } from "../src/lib/chapters";
import { updateContact } from "../src/lib/workshop/portal";
import { memberKey } from "../src/lib/workshop/roster";

const SLUG = "zz-workshop-edit-delete-me";
let pass = 0, fail = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label} ${detail}`); }
}

async function realCounts() {
  const r = await db.execute(sql`
    select (select count(*)::int from workshop_contacts) c,
           (select count(*)::int from workshop_sessions) s`);
  return JSON.stringify((r.rows ?? r)[0]);
}

async function main() {
  const before = await realCounts();
  console.log(`BEFORE ${before}\n`);

  let chapterId: string | undefined;
  try {
    const [chapter] = await db.insert(chapters)
      .values({ name: "ZZ Workshop Edit", slug: SLUG }).returning();
    chapterId = chapter!.id;
    const [session] = await db.insert(workshopSessions)
      .values({ chapterId, portalPassword: "zz", isLive: false }).returning();
    const sid = session!.id;

    const me = "Harry Bowers";
    const add = async (name: string, company: string, phone: string, email: string) => {
      const [row] = await db.insert(workshopContacts).values({
        sessionId: sid, round: 1, submitterTeam: "pt", seatTeam: "pt", seatIndex: 0,
        category: "Roofer", contactName: name, company, phone, email, points: 1,
        claimedBy: me, claimedByKey: memberKey(me), claimedAt: new Date(),
        nameKey: name.toLowerCase(), companyKey: company.toLowerCase(),
        phoneKey: phone.replace(/\D/g, ""), emailKey: email.toLowerCase(),
      }).returning();
      return row!.id;
    };

    const a = await add("Dave Mason", "Mason Roofing", "0161 111 2222", "dave@mason.test");
    await add("Tom Wild", "Wild Roofing", "0161 999 8888", "tom@wild.test");

    console.log("Keys follow the fields");
    const r1 = await updateContact(sid, a, me, { phone: "0161 333 4444" });
    check("the edit succeeds", r1.ok);
    const after1 = await db.query.workshopContacts.findFirst({ where: eq(workshopContacts.id, a) });
    check("phone is stored", after1?.phone === "0161 333 4444", after1?.phone ?? "");
    // This is the whole point: before, the key kept the old number and the
    // dedupe index silently stopped matching reality.
    check("phoneKey follows it", after1?.phoneKey === "01613334444", after1?.phoneKey ?? "");

    await updateContact(sid, a, me, { email: "DAVE@Mason.TEST" });
    const after2 = await db.query.workshopContacts.findFirst({ where: eq(workshopContacts.id, a) });
    check("emailKey follows and is normalised", after2?.emailKey === "dave@mason.test", after2?.emailKey ?? "");

    console.log("\nCollisions say what is wrong");
    const clashPhone = await updateContact(sid, a, me, { phone: "0161 999 8888" });
    check("a duplicate phone is refused", !clashPhone.ok);
    check("and says so plainly",
      !clashPhone.ok && /already has that phone number/.test(clashPhone.error), !clashPhone.ok ? clashPhone.error : "");
    check("not 'signed out'", !clashPhone.ok && !/signed out/i.test(clashPhone.error));

    const clashEmail = await updateContact(sid, a, me, { email: "tom@wild.test" });
    check("a duplicate email is refused", !clashEmail.ok);
    check("and names the email", !clashEmail.ok && /email address/.test(clashEmail.error),
      !clashEmail.ok ? clashEmail.error : "");

    const afterClash = await db.query.workshopContacts.findFirst({ where: eq(workshopContacts.id, a) });
    check("the refused edits changed nothing", afterClash?.phone === "0161 333 4444");
    check("and the email survived", afterClash?.email === "DAVE@Mason.TEST", afterClash?.email ?? "");

    console.log("\nStill locked to the claimant");
    const notMine = await updateContact(sid, a, "Somebody Else", { phone: "0999" });
    check("another member cannot edit", !notMine.ok);
  } finally {
    if (chapterId) {
      await db.delete(chapters).where(eq(chapters.id, chapterId));
      console.log("\nThrowaway chapter deleted.");
    }
  }

  const after = await realCounts();
  console.log(`AFTER  ${after}`);
  check("real workshop data is untouched", before === after, `${before} -> ${after}`);
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
