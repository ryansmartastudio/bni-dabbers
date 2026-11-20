/** Exercises the cron route handler itself: auth, the per-member cap, dry mode. */
process.env.CRON_SECRET = "zz-test-secret-not-a-real-one";

import { eq, sql } from "drizzle-orm";
import { db } from "../src/db";
import { chapters, crmVisitors, members } from "../src/db/schema";

const SLUG = "zz-cron-test-delete-me";
const DAY = 86_400_000;

let pass = 0, fail = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label} ${detail}`); }
}

const url = "https://example.invalid/api/cron/crm-reminders";

async function main() {
  const { GET } = await import("../src/app/api/cron/crm-reminders/route");

  const before = (await db.execute(sql`select count(*)::int as n from crm_reminders`)).rows?.[0];
  console.log(`BEFORE reminders=${JSON.stringify(before)}\n`);

  let chapterId: string | undefined;
  try {
    console.log("The guard");
    check("no header is 401", (await GET(new Request(url))).status === 401);
    check("wrong secret is 401",
      (await GET(new Request(url, { headers: { authorization: "Bearer wrong" } }))).status === 401);
    check("the raw secret without Bearer is 401",
      (await GET(new Request(url, { headers: { authorization: process.env.CRON_SECRET! } }))).status === 401);
    check("a longer guess is 401",
      (await GET(new Request(url, { headers: { authorization: "Bearer " + "x".repeat(400) } }))).status === 401);

    const auth = { authorization: `Bearer ${process.env.CRON_SECRET}` };
    check("the right secret is 200", (await GET(new Request(`${url}?dry=1`, { headers: auth }))).status === 200);

    // One member sitting on five overdue visitors.
    const [chapter] = await db.insert(chapters).values({ name: "ZZ Cron Test", slug: SLUG }).returning();
    chapterId = chapter!.id;
    const [owner] = await db.insert(members).values({
      chapterId, firstName: "Cron", lastName: "Tester", company: "ZZ", bniSeat: "Tester",
      email: "zz-cron-test@example.invalid", phone: "0",
    }).returning();

    for (let i = 1; i <= 5; i++) {
      await db.insert(crmVisitors).values({
        chapterId, name: `Overdue ${i}`, nameKey: `overdue ${i}`, companyKey: "",
        ownerMemberId: owner!.id, ownerClaimedAt: new Date(Date.now() - (10 + i) * DAY),
      });
    }

    console.log("\nThe dry run");
    const res = await GET(new Request(`${url}?dry=1`, { headers: auth }));
    const body = await res.json();
    const mine = (body.detail as { to: string; visitor: string; why: string }[])
      .filter((d) => d.to === "zz-cron-test@example.invalid");

    check("it says it is a dry run", body.dryRun === true);
    check("five overdue become three emails", mine.length === 3, `got ${mine.length}`);
    check("the other two are held", body.heldForTomorrow >= 2, `held ${body.heldForTomorrow}`);
    check("the oldest claim goes first", mine[0]?.visitor === "Overdue 5", mine[0]?.visitor);
    check("each line says why", mine.every((d) => /claimed \d+ days ago/.test(d.why)));
    check("each line says which attempt", mine.every((d) => /^1 of 4$/.test((d as never as {attempt:string}).attempt)));

    const after = (await db.execute(sql`select count(*)::int as n from crm_reminders`)).rows?.[0];
    check("a dry run writes no reminder rows", JSON.stringify(after) === JSON.stringify(before),
      `${JSON.stringify(before)} -> ${JSON.stringify(after)}`);
  } finally {
    if (chapterId) {
      await db.delete(chapters).where(eq(chapters.id, chapterId));
      console.log("\nThrowaway chapter deleted.");
    }
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
