/**
 * Sends the "your visitor pipeline is ready" email to members.
 *
 * Dry run unless --send is passed, because the recipients are real people
 * with real inboxes and there is no unsending. The same code path serves one
 * test recipient and the whole chapter, so a test that passes means the
 * rollout will behave identically.
 *
 *   npm run crm:welcome -- --to harry.heath@xofleet.co.uk          (preview)
 *   npm run crm:welcome -- --to harry.heath@xofleet.co.uk --send   (sends)
 *   npm run crm:welcome -- --all                                   (preview)
 *   npm run crm:welcome -- --all --send                            (sends)
 *
 * --all skips anyone already linked to a sign-in: they have been in, so they
 * do not need telling it exists.  --include-linked overrides that.
 */
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../src/db";
import { crmVisitors, members } from "../src/db/schema";
import { getDefaultChapterId } from "../src/lib/chapters";
import { getCrmSignUpUrl, getCrmUrl } from "../src/lib/crm-host";
import { buildCrmWelcomeEmail } from "../src/lib/email/crm-welcome-email";
import {
  getResendFromEmail,
  getResendReplyTo,
  sendEmail,
} from "../src/lib/email/resend";
import { getChapterSettings } from "../src/lib/settings";

const argv = process.argv.slice(2);
const has = (flag: string) => argv.includes(flag);
function value(flag: string): string | null {
  const at = argv.indexOf(flag);
  return at !== -1 ? (argv[at + 1] ?? null) : null;
}

const SEND = has("--send");
const ALL = has("--all");
const INCLUDE_LINKED = has("--include-linked");
const TO = value("--to");

async function main() {
  if (!TO && !ALL) {
    throw new Error("Pass --to <email> or --all.");
  }
  if (TO && ALL) {
    throw new Error("Pass one of --to or --all, not both.");
  }

  const chapterId = await getDefaultChapterId();
  const settings = await getChapterSettings();

  // The figures quoted in the email, read now so they are true when it lands.
  const [counts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      unclaimed: sql<number>`count(*) filter (where ${crmVisitors.ownerMemberId} is null)::int`,
    })
    .from(crmVisitors)
    .where(
      and(eq(crmVisitors.chapterId, chapterId), isNull(crmVisitors.archivedAt)),
    );

  const recipients = await db
    .select({
      id: members.id,
      firstName: members.firstName,
      lastName: members.lastName,
      email: members.email,
      clerkUserId: members.clerkUserId,
    })
    .from(members)
    .where(and(eq(members.chapterId, chapterId), eq(members.status, "active")))
    .orderBy(asc(members.firstName));

  let chosen = recipients;
  if (TO) {
    chosen = recipients.filter(
      (m) => m.email.trim().toLowerCase() === TO.trim().toLowerCase(),
    );
    if (chosen.length === 0) {
      // Sending to an address the chapter does not hold would produce an
      // email telling somebody to sign in with an address that will not let
      // them in. Refusing is the only honest option.
      throw new Error(
        `No active member in this chapter has the address ${TO}. ` +
          `The email tells people to sign in with the address it was sent to, ` +
          `so sending it to an unknown address would be a lie.`,
      );
    }
  } else if (!INCLUDE_LINKED) {
    chosen = recipients.filter((m) => !m.clerkUserId);
  }

  console.log(`Chapter:     ${settings.chapterName}`);
  console.log(`Pipeline:    ${counts?.total ?? 0} live, ${counts?.unclaimed ?? 0} unclaimed`);
  console.log(`Active:      ${recipients.length}`);
  console.log(`Already in:  ${recipients.filter((m) => m.clerkUserId).length}`);
  console.log(`Recipients:  ${chosen.length}`);
  // Printed because these are what the recipient sees in their inbox, and a
  // wrong From on a chapter-wide send is worth catching in the dry run. The
  // API key is never printed; only whether one is configured at all.
  console.log(`From:        ${getResendFromEmail()}`);
  console.log(`Reply-to:    ${getResendReplyTo()}`);
  console.log(`API key:     ${process.env.RESEND_API_KEY ? "configured" : "MISSING"}`);
  console.log(`Mode:        ${SEND ? "SENDING FOR REAL" : "dry run (add --send to send)"}`);
  console.log("");

  for (const member of chosen) {
    const email = buildCrmWelcomeEmail({
      settings,
      member,
      crmUrl: getCrmUrl("/"),
      signUpUrl: getCrmSignUpUrl(),
      toolkitUrl: getCrmUrl("/toolkit"),
      unclaimedCount: counts?.unclaimed ?? 0,
      totalCount: counts?.total ?? 0,
    });

    if (!SEND) {
      console.log(`  would send to ${member.firstName} ${member.lastName} <${member.email}>`);
      continue;
    }

    try {
      await sendEmail({
        to: member.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });
      console.log(`  sent to ${member.firstName} ${member.lastName} <${member.email}>`);
    } catch (error) {
      // One bad address must not stop the rest of the chapter getting theirs.
      console.error(
        `  FAILED ${member.firstName} <${member.email}>: ${(error as Error).message}`,
      );
    }
  }

  console.log("");
  console.log(SEND ? "Done." : "Nothing was sent. Add --send to send it.");
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
