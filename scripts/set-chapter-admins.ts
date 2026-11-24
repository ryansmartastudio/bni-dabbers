/**
 * Names the chapter's admins, by name or email.
 *
 * Dry run unless --apply is passed. Refuses anything that does not match
 * exactly one active member: admin rights are not something to hand to the
 * nearest guess, and a chapter with two Martins should stop this script
 * rather than pick one.
 *
 *   npm run crm:admins -- "Harry Heath" "Bex Widdowson"          (preview)
 *   npm run crm:admins -- "Harry Heath" "Bex Widdowson" --apply  (sets them)
 *   npm run crm:admins -- --list                                 (who is one)
 *
 * It writes the member row only. Clerk is updated for anybody already
 * signed in the next time they load a page, and for everybody else when
 * they first sign up, which is the point of keeping the flag here.
 */
import { and, asc, eq } from "drizzle-orm";
import { db } from "../src/db";
import { members } from "../src/db/schema";
import { getDefaultChapterId } from "../src/lib/chapters";

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const LIST = argv.includes("--list");
const wanted = argv.filter((arg) => !arg.startsWith("--"));

function matches(
  person: { firstName: string; lastName: string; email: string },
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  const full = `${person.firstName} ${person.lastName}`.toLowerCase();
  return (
    full === q ||
    person.email.toLowerCase() === q ||
    person.firstName.toLowerCase() === q
  );
}

async function main() {
  const chapterId = await getDefaultChapterId();
  const roster = await db
    .select({
      id: members.id,
      firstName: members.firstName,
      lastName: members.lastName,
      email: members.email,
      isAdmin: members.isChapterAdmin,
      clerkUserId: members.clerkUserId,
    })
    .from(members)
    .where(and(eq(members.chapterId, chapterId), eq(members.status, "active")))
    .orderBy(asc(members.firstName));

  if (LIST || wanted.length === 0) {
    console.log("Chapter admins:");
    const admins = roster.filter((person) => person.isAdmin);
    if (admins.length === 0) console.log("  (none)");
    for (const person of admins) {
      console.log(
        `  ${person.firstName} ${person.lastName} <${person.email}>` +
          `${person.clerkUserId ? "" : "  [not signed up yet]"}`,
      );
    }
    if (!LIST) console.log("\nPass names to set them, or --list on its own.");
    return;
  }

  const chosen: typeof roster = [];
  const problems: string[] = [];

  for (const query of wanted) {
    const found = roster.filter((person) => matches(person, query));
    if (found.length === 0) problems.push(`No active member matches "${query}".`);
    else if (found.length > 1) {
      problems.push(
        `"${query}" matches ${found.length}: ` +
          found.map((p) => `${p.firstName} ${p.lastName}`).join(", "),
      );
    } else chosen.push(found[0]!);
  }

  if (problems.length > 0) {
    console.error("Nothing was changed:");
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }

  console.log(`Mode: ${APPLY ? "APPLYING" : "dry run (add --apply)"}\n`);
  for (const person of chosen) {
    const already = person.isAdmin ? " (already an admin)" : "";
    const signedUp = person.clerkUserId
      ? "will get it on their next page load"
      : "will get it when they sign up";
    console.log(
      `  ${person.firstName} ${person.lastName} <${person.email}>${already}` +
        `\n      ${signedUp}`,
    );
  }

  if (!APPLY) {
    console.log("\nNothing written. Add --apply.");
    return;
  }

  for (const person of chosen) {
    await db
      .update(members)
      .set({ isChapterAdmin: true, updatedAt: new Date() })
      .where(and(eq(members.id, person.id), eq(members.chapterId, chapterId)));
  }
  console.log(`\nDone. ${chosen.length} marked as chapter admins.`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
