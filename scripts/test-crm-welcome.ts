/**
 * Who the welcome email would go to, and what the email says.
 *
 * Nothing here sends: sendEmailBatch is swapped for a recorder, so the test
 * can assert the exact recipients and bodies without touching anybody's
 * inbox. That substitution is the whole point -- the failure this guards
 * against is emailing the wrong people, which you cannot discover by
 * sending and looking.
 *
 * A throwaway chapter, and the real chapter's rows are compared before and
 * after, because local dev points at the production database.
 */
import { eq, sql } from "drizzle-orm";
import { db } from "../src/db";
import { chapters, members } from "../src/db/schema";
import { buildCrmWelcomeEmail } from "../src/lib/email/crm-welcome-email";
import { getChapterSettings } from "../src/lib/settings";

let pass = 0, fail = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label} ${detail}`); }
}

// --- stand in for Resend before the module that uses it is loaded ---------
type Sent = { to: string; subject: string; html: string; text: string };
const outbox: Sent[] = [];
let nextFailures: { index: number; message: string }[] = [];

/**
 * Replaces the real sender, then loads the module that calls it.
 *
 * Order matters and so does the direction: welcome.ts must be imported
 * AFTER the stub is in place, or it closes over the real function and the
 * first test emails five people for real.
 */
async function loadWithStubbedResend() {
  const resendModule = await import("../src/lib/email/resend");
  Object.defineProperty(resendModule, "sendEmailBatch", {
    value: async (emails: Sent[]) => {
      outbox.push(...emails);
      const failures = nextFailures;
      nextFailures = [];
      return { failures, sent: emails.length - failures.length };
    },
    writable: true,
    configurable: true,
  });
  return import("../src/lib/crm/welcome");
}

async function realCounts() {
  const [row] = await db.execute(sql`
    select (select count(*)::int from chapters) c,
           (select count(*)::int from members) m,
           (select count(*)::int from members where crm_welcome_sent_at is not null) emailed
  `).then((r) => (Array.isArray(r) ? r : (r as { rows: unknown[] }).rows)) as Record<string, number>[];
  return row!;
}

async function main() {
  const { listWelcomeRecipients, sendWelcomeEmails } =
    await loadWithStubbedResend();

  const before = await realCounts();
  console.log("BEFORE", JSON.stringify(before));

  const slug = `test-welcome-${Date.now()}`;
  const [chapter] = await db
    .insert(chapters)
    .values({ name: "Throwaway Welcome Test", slug })
    .returning();
  const chapterId = chapter!.id;

  async function addMember(
    first: string,
    email: string,
    extra: Record<string, unknown> = {},
  ) {
    const [row] = await db
      .insert(members)
      .values({
        chapterId,
        firstName: first,
        lastName: "Tester",
        company: "Test Co",
        bniSeat: "Tester",
        phone: "00000 000000",
        email,
        status: "active",
        slug: `${slug}-${first.toLowerCase()}`,
        ...extra,
      })
      .returning();
    return row!;
  }

  try {
    const amy = await addMember("Amy", "amy@example.test");
    const ben = await addMember("Ben", "ben@example.test", {
      clerkUserId: "user_already_in",
    });
    const cal = await addMember("Cal", "cal@example.test", {
      crmWelcomeSentAt: new Date("2026-11-01T09:00:00Z"),
    });
    const dot = await addMember("Dot", "not-an-email");
    const eve = await addMember("Eve", "eve@example.test", {
      status: "inactive",
    });

    console.log("\nWho the page offers");
    const listed = await listWelcomeRecipients(chapterId);
    check("only active members are listed", listed.length === 4, String(listed.length));
    check("the inactive one is left out", listed.every((r) => r.id !== eve.id));
    check("somebody signed in is marked so",
      listed.find((r) => r.id === ben.id)?.signedIn === true);
    check("somebody already emailed shows the date",
      listed.find((r) => r.id === cal.id)?.emailedAt !== null);
    check("a new member shows neither",
      listed.find((r) => r.id === amy.id)?.signedIn === false &&
      listed.find((r) => r.id === amy.id)?.emailedAt === null);

    console.log("\nSending to one person");
    outbox.length = 0;
    const one = await sendWelcomeEmails(chapterId, [amy.id]);
    check("it succeeds", one.ok);
    check("exactly one email", outbox.length === 1, String(outbox.length));
    check("to the right address", outbox[0]?.to === "amy@example.test");
    check("the subject names the chapter",
      outbox[0]?.subject.includes("BNI Dabbers") === true, outbox[0]?.subject);
    // The single most important line in the email.
    check("the body tells them which address to use",
      outbox[0]?.text.includes("amy@example.test") === true);
    check("so does the HTML",
      outbox[0]?.html.includes("amy@example.test") === true);
    check("it links to the CRM subdomain",
      outbox[0]?.html.includes("https://crm.bnidabbers.co.uk") === true);
    check("and to the toolkit",
      outbox[0]?.html.includes("https://crm.bnidabbers.co.uk/toolkit") === true);
    check("no unresolved template holes",
      !/\$\{|\{\{|undefined|NaN/.test(outbox[0]?.html ?? "undefined"));

    const afterOne = await listWelcomeRecipients(chapterId);
    check("they are now recorded as emailed",
      afterOne.find((r) => r.id === amy.id)?.emailedAt !== null);
    check("and nobody else was touched",
      afterOne.find((r) => r.id === dot.id)?.emailedAt === null);

    console.log("\nAddresses that cannot be used");
    outbox.length = 0;
    const bad = await sendWelcomeEmails(chapterId, [dot.id]);
    // The email says "sign in with the address this arrived at", so sending
    // it to a broken address would be an instruction nobody can follow.
    check("a malformed address is refused, not sent", !bad.ok, JSON.stringify(bad));
    check("and nothing went out", outbox.length === 0);

    outbox.length = 0;
    const mixed = await sendWelcomeEmails(chapterId, [ben.id, dot.id]);
    check("a mixed batch still sends the good one", mixed.ok);
    check("one email, not two", outbox.length === 1, String(outbox.length));
    check("it went to the valid address", outbox[0]?.to === "ben@example.test");
    check("and the bad one is reported as skipped",
      mixed.ok && mixed.data.skipped.length === 1 &&
      mixed.data.skipped[0]?.name.startsWith("Dot"));

    console.log("\nWhen Resend rejects somebody");
    outbox.length = 0;
    // Only the ones that actually went should be stamped, or a retry would
    // skip exactly the people who missed out.
    nextFailures = [{ index: 0, message: "Invalid recipient" }];
    const partial = await sendWelcomeEmails(chapterId, [cal.id]);
    check("the call still succeeds", partial.ok);
    check("but nothing counts as sent",
      partial.ok && partial.data.sent === 0, partial.ok ? String(partial.data.sent) : "");
    check("and the failure is named",
      partial.ok && partial.data.failures[0]?.email === "cal@example.test");
    const afterFail = await listWelcomeRecipients(chapterId);
    check("their old emailed date is left alone",
      afterFail.find((r) => r.id === cal.id)?.emailedAt?.startsWith("2026-11-01") === true,
      String(afterFail.find((r) => r.id === cal.id)?.emailedAt));

    console.log("\nIt cannot reach another chapter");
    const [other] = await db.insert(chapters)
      .values({ name: "Other", slug: `${slug}-other` }).returning();
    try {
      const [outsider] = await db.insert(members).values({
        chapterId: other!.id, firstName: "Zed", lastName: "Outsider",
        company: "X", bniSeat: "X", phone: "0", email: "zed@example.test",
        status: "active", slug: `${slug}-zed`,
      }).returning();

      outbox.length = 0;
      const across = await sendWelcomeEmails(chapterId, [outsider!.id]);
      check("an id from another chapter finds nobody", !across.ok);
      check("and emails nobody", outbox.length === 0);

      outbox.length = 0;
      const mixedChapters = await sendWelcomeEmails(chapterId, [amy.id, outsider!.id]);
      check("a mixed-chapter list only emails our own", mixedChapters.ok && outbox.length === 1);
      check("and it is the right person", outbox[0]?.to === "amy@example.test");
    } finally {
      await db.delete(chapters).where(eq(chapters.id, other!.id));
    }

    console.log("\nGuards on the batch itself");
    outbox.length = 0;
    check("an empty list is refused",
      !(await sendWelcomeEmails(chapterId, [])).ok);
    check("over a hundred is refused",
      !(await sendWelcomeEmails(chapterId, Array.from({ length: 101 }, (_, i) => `id-${i}`))).ok);
    check("a repeated id is only emailed once",
      (await sendWelcomeEmails(chapterId, [amy.id, amy.id, amy.id])).ok &&
      outbox.length === 1, String(outbox.length));

    console.log("\nThe copy obeys the house rules");
    const settings = await getChapterSettings();
    const sample = buildCrmWelcomeEmail({
      settings,
      member: { firstName: "Amy", email: "amy@example.test" },
      crmUrl: "https://crm.bnidabbers.co.uk",
      toolkitUrl: "https://crm.bnidabbers.co.uk/toolkit",
      unclaimedCount: 107,
      totalCount: 107,
    });
    // "107 people, of whom 107" reads like a broken mail merge.
    check("all-unclaimed reads as a sentence",
      sample.text.includes("not one of them has anybody down to invite them yet"),
      sample.text.slice(0, 200));
    const some = buildCrmWelcomeEmail({
      settings,
      member: { firstName: "Amy", email: "amy@example.test" },
      crmUrl: "https://crm.bnidabbers.co.uk",
      toolkitUrl: "https://crm.bnidabbers.co.uk/toolkit",
      unclaimedCount: 40,
      totalCount: 107,
    });
    check("and so does a partial count",
      some.text.includes("40 of them still have nobody"), some.text.slice(0, 200));
    check("the preheader carries the address",
      sample.html.includes("Sign in with amy@example.test"));
    check("no em dash in the plain text", !sample.text.includes("\u2014"));
  } finally {
    await db.delete(chapters).where(eq(chapters.id, chapterId));
    console.log("\nThrowaway chapter deleted.");
  }

  const after = await realCounts();
  console.log("AFTER ", JSON.stringify(after));
  check("the real chapter is untouched",
    before.c === after.c && before.m === after.m && before.emailed === after.emailed,
    `${JSON.stringify(before)} vs ${JSON.stringify(after)}`);

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
