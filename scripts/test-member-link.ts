/**
 * The "first link only" rule, and the notices it sends.
 *
 * The update pair is replicated here rather than calling linkMemberFromClaims,
 * which needs a live Clerk session. What is under test is the part that
 * decides whether a notification goes out at all.
 */
import { and, eq, isNull } from "drizzle-orm";
import { writeFileSync } from "node:fs";
import { db } from "../src/db";
import { chapters, members } from "../src/db/schema";
import {
  buildMemberLinkedAdminNotice,
  buildMemberLinkedEmail,
} from "../src/lib/email/member-linked-email";
import { getChapterSettings } from "../src/lib/settings";

const SLUG = "zz-link-test-delete-me";
const OUT = process.argv[2];

let pass = 0, fail = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label} ${detail}`); }
}

/** The two statements from linkMemberFromClaims, verbatim in behaviour. */
async function link(memberId: string, userId: string) {
  const [firstLink] = await db.update(members)
    .set({ clerkUserId: userId, updatedAt: new Date() })
    .where(and(eq(members.id, memberId), isNull(members.clerkUserId)))
    .returning();

  const linked = firstLink ?? (await db.update(members)
    .set({ updatedAt: new Date() })
    .where(and(eq(members.id, memberId), eq(members.clerkUserId, userId)))
    .returning())[0];

  return { linked: linked ?? null, notifies: Boolean(firstLink) };
}

async function main() {
  const before = JSON.stringify((await db.execute(
    `select count(*)::int as n, count(clerk_user_id)::int as linked from members`,
  )).rows?.[0]);
  console.log(`BEFORE members ${before}\n`);

  let chapterId: string | undefined;
  try {
    const [chapter] = await db.insert(chapters)
      .values({ name: "ZZ Link Test", slug: SLUG }).returning();
    chapterId = chapter!.id;

    const [member] = await db.insert(members).values({
      chapterId, firstName: "Zed", lastName: "Tester", company: "ZZ",
      bniSeat: "Tester", email: "zz-link-test@example.invalid", phone: "0",
    }).returning();

    console.log("Linking");
    const first = await link(member!.id, "user_aaa");
    check("the first link succeeds", first.linked !== null);
    check("and it notifies", first.notifies);

    const again = await link(member!.id, "user_aaa");
    check("signing in again still resolves the member", again.linked !== null);
    check("but does not notify a second time", !again.notifies);

    const other = await link(member!.id, "user_bbb");
    check("somebody else's account is refused", other.linked === null);
    check("and is not notified", !other.notifies);

    const stored = await db.query.members.findFirst({ where: eq(members.id, member!.id) });
    check("the row still belongs to the first account", stored?.clerkUserId === "user_aaa");

    console.log("\nThe notices");
    const settings = await getChapterSettings();
    const when = new Date();
    const same = buildMemberLinkedEmail({
      settings, member: member!, signedInWith: member!.email,
      pipelineUrl: "https://www.bnidabbers.co.uk/crm", when,
    });
    const diff = buildMemberLinkedEmail({
      settings, member: member!, signedInWith: "someone.else@gmail.com",
      pipelineUrl: "https://www.bnidabbers.co.uk/crm", when,
    });
    const notice = buildMemberLinkedAdminNotice({
      settings, member: member!, signedInWith: "someone.else@gmail.com", when,
    });

    check("the member's notice names the chapter", /BNI Dabbers/.test(same.subject), same.subject);
    check("it says what to do if it wasn't them", /wasn't you/i.test(same.text) || /wasn't you/i.test(same.html));
    check("it links to the pipeline", same.html.includes("https://www.bnidabbers.co.uk/crm"));
    check("the same address is not called out", !same.text.includes("using "));
    check("a different address IS called out", diff.text.includes("using someone.else@gmail.com"));
    check("the chapter's copy names the member", notice.text.includes("zz-link-test@example.invalid"));
    check("and says how to undo it", /clerk_user_id/.test(notice.text));

    if (OUT) {
      writeFileSync(`${OUT}/account-linked-member.html`, diff.html);
      writeFileSync(`${OUT}/account-linked-chapter.html`, notice.html);
      console.log(`\nPreviews written to ${OUT}`);
    }
  } finally {
    if (chapterId) {
      await db.delete(chapters).where(eq(chapters.id, chapterId));
      console.log("\nThrowaway chapter deleted.");
    }
  }

  const after = JSON.stringify((await db.execute(
    `select count(*)::int as n, count(clerk_user_id)::int as linked from members`,
  )).rows?.[0]);
  console.log(`AFTER  members ${after}`);
  check("real members untouched", before === after, `${before} -> ${after}`);
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
