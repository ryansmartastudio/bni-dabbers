/**
 * Naming a chapter admin.
 *
 * Everything runs against a throwaway chapter whose members have no Clerk
 * account, which is also the case that matters most: four of the five Ryan
 * named had never signed in, and the whole reason the flag lives on the
 * member row is that it can be set before there is anybody to set it on.
 *
 * Nothing here touches Clerk: the write is injected, so the signed-in
 * paths are covered too and the test can assert which role was sent.
 */
import { eq, sql } from "drizzle-orm";
import { db } from "../src/db";
import { chapters, members } from "../src/db/schema";
import { setChapterAdmin } from "../src/lib/crm/chapter-admins";
import { listWelcomeRecipients } from "../src/lib/crm/welcome";

/** Stands in for the Clerk write, and remembers what it was asked to do. */
const clerkWrites: Array<{ user: string; role: string }> = [];
let clerkShouldFail = false;
const recordClerk = async (user: string, role: "admin" | "member") => {
  if (clerkShouldFail) throw new Error("Clerk is down");
  clerkWrites.push({ user, role });
};
const setAdmin = (
  chapterId: string, memberId: string, on: boolean, actor: string,
) => setChapterAdmin(chapterId, memberId, on, actor, recordClerk);

let pass = 0, fail = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label} ${detail}`); }
}

async function realCounts() {
  const [row] = await db.execute(sql`
    select (select count(*)::int from chapters) c,
           (select count(*)::int from members) m,
           (select count(*)::int from members where is_chapter_admin) admins
  `).then((r) => (Array.isArray(r) ? r : (r as { rows: unknown[] }).rows)) as Record<string, number>[];
  return row!;
}

async function main() {
  const before = await realCounts();
  console.log("BEFORE", JSON.stringify(before));

  const slug = `test-admins-${Date.now()}`;
  const [chapter] = await db.insert(chapters)
    .values({ name: "Throwaway Admin Test", slug }).returning();
  const chapterId = chapter!.id;

  async function addMember(first: string, extra: Record<string, unknown> = {}) {
    const [row] = await db.insert(members).values({
      chapterId, firstName: first, lastName: "Tester", company: "Test Co",
      bniSeat: "Tester", phone: "00000 000000",
      email: `${slug}-${first.toLowerCase()}@example.test`,
      status: "active", slug: `${slug}-${first.toLowerCase()}`, ...extra,
    }).returning();
    return row!;
  }

  try {
    const amy = await addMember("Amy");
    const ben = await addMember("Ben", { clerkUserId: "user_ben_signed_in" });

    console.log("\nEverybody starts as an ordinary member");
    let listed = await listWelcomeRecipients(chapterId);
    check("nobody is an admin to begin with",
      listed.every((person) => !person.isAdmin));

    console.log("\nNaming somebody who has never signed in");
    const named = await setAdmin(chapterId, amy.id, true, "user_someone_else");
    check("it succeeds", named.ok);
    check("it says the name back", named.ok && named.data.name === "Amy Tester");
    // The distinction that matters: the row is set, Clerk is not touched,
    // and the promotion happens the first time they appear.
    check("and reports that Clerk was not written to",
      named.ok && named.data.applied === false);

    listed = await listWelcomeRecipients(chapterId);
    check("the page now shows them as an admin",
      listed.find((person) => person.id === amy.id)?.isAdmin === true);
    check("and nobody else moved",
      listed.find((person) => person.id === ben.id)?.isAdmin === false);

    console.log("\nTaking it back");
    const removed = await setAdmin(chapterId, amy.id, false, "user_someone_else");
    check("removing succeeds", removed.ok);
    listed = await listWelcomeRecipients(chapterId);
    check("they are an ordinary member again",
      listed.find((person) => person.id === amy.id)?.isAdmin === false);

    console.log("\nYou cannot lock yourself out");
    await setAdmin(chapterId, ben.id, true, "user_someone_else");
    const selfRemove = await setAdmin(
      chapterId, ben.id, false, "user_ben_signed_in",
    );
    check("removing your own admin is refused", !selfRemove.ok);
    check("and says why",
      !selfRemove.ok && selfRemove.error.includes("your own"));
    listed = await listWelcomeRecipients(chapterId);
    check("so they are still an admin",
      listed.find((person) => person.id === ben.id)?.isAdmin === true);
    // Somebody else may still remove them: the rule is about locking the
    // last admin out by accident, not about being unremovable.
    check("but somebody else can",
      (await setAdmin(chapterId, ben.id, false, "user_someone_else")).ok);

    console.log("\nSetting it twice is not an error");
    check("naming an admin again is fine",
      (await setAdmin(chapterId, amy.id, true, "x")).ok &&
      (await setAdmin(chapterId, amy.id, true, "x")).ok);
    check("and so is removing one who is not",
      (await setAdmin(chapterId, ben.id, false, "x")).ok);

    console.log("\nSomebody already signed in gets it straight away");
    clerkWrites.length = 0;
    const live = await setAdmin(chapterId, ben.id, true, "user_someone_else");
    check("it succeeds", live.ok);
    check("and reports that Clerk took it", live.ok && live.data.applied === true);
    check("exactly one write went to Clerk", clerkWrites.length === 1,
      JSON.stringify(clerkWrites));
    check("to the right user", clerkWrites[0]?.user === "user_ben_signed_in");
    check("with the admin role", clerkWrites[0]?.role === "admin");

    clerkWrites.length = 0;
    await setAdmin(chapterId, ben.id, false, "user_someone_else");
    // Demoting has to reach Clerk too, or the row says member and the
    // middleware keeps letting them in.
    check("removing sends the member role back",
      clerkWrites.length === 1 && clerkWrites[0]?.role === "member",
      JSON.stringify(clerkWrites));

    console.log("\nWhen Clerk is down");
    clerkShouldFail = true;
    clerkWrites.length = 0;
    const failed = await setAdmin(chapterId, ben.id, true, "user_someone_else");
    clerkShouldFail = false;
    check("it reports a problem rather than pretending", !failed.ok);
    check("and says they will get it next time they sign in",
      !failed.ok && failed.error.includes("next time they sign in"), 
      !failed.ok ? failed.error : "");
    // The row is still written, which is what makes that promise true.
    const rowAfterFailure = await db.query.members.findFirst({
      where: eq(members.id, ben.id),
    });
    check("the member row was still set", rowAfterFailure?.isChapterAdmin === true);
    await setAdmin(chapterId, ben.id, false, "user_someone_else");

    console.log("\nIt cannot reach another chapter");
    const [other] = await db.insert(chapters)
      .values({ name: "Other", slug: `${slug}-other` }).returning();
    try {
      const [outsider] = await db.insert(members).values({
        chapterId: other!.id, firstName: "Zed", lastName: "Outsider",
        company: "X", bniSeat: "X", phone: "0",
        email: `${slug}-zed@example.test`, status: "active",
        slug: `${slug}-zed`,
      }).returning();

      check("a member of another chapter is not found",
        !(await setAdmin(chapterId, outsider!.id, true, "x")).ok);
      const stillOrdinary = await db.query.members.findFirst({
        where: eq(members.id, outsider!.id),
      });
      check("and was not promoted anyway",
        stillOrdinary?.isChapterAdmin === false);
      check("a made-up id is refused",
        !(await setAdmin(chapterId, "00000000-0000-4000-8000-000000000000", true, "x")).ok);
    } finally {
      await db.delete(chapters).where(eq(chapters.id, other!.id));
    }
  } finally {
    await db.delete(chapters).where(eq(chapters.id, chapterId));
    console.log("\nThrowaway chapter deleted.");
  }

  const after = await realCounts();
  console.log("AFTER ", JSON.stringify(after));
  check("the real chapter is untouched",
    before.c === after.c && before.m === after.m && before.admins === after.admins,
    `${JSON.stringify(before)} vs ${JSON.stringify(after)}`);

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
