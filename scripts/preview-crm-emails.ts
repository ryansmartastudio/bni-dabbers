/** Renders the CRM emails to HTML files so they can be looked at. */
import { writeFileSync } from "node:fs";
import { buildCrmReminderEmail } from "../src/lib/email/crm-reminder-email";
import { getChapterSettings } from "../src/lib/settings";

const out = process.argv[2];
if (!out) throw new Error("Pass an output directory.");

async function main() {
  const settings = await getChapterSettings();
  const base = "https://www.bnidabbers.co.uk/crm/r/EXAMPLE-TOKEN";

  const first = buildCrmReminderEmail({
    settings, memberFirstName: "Harry", visitorName: "Dave Mason",
    visitorCompany: "Mason Plumbing", attempt: 1, maxAttempts: 4,
    yesUrl: `${base}/yes`, noUrl: `${base}/no`,
  });
  const last = buildCrmReminderEmail({
    settings, memberFirstName: "Harry", visitorName: "Dave Mason",
    visitorCompany: "Mason Plumbing", attempt: 4, maxAttempts: 4,
    yesUrl: `${base}/yes`, noUrl: `${base}/no`,
  });

  writeFileSync(`${out}/reminder-first.html`, first.html);
  writeFileSync(`${out}/reminder-last.html`, last.html);
  console.log(`subject: ${first.subject}`);
  console.log(`written to ${out}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
