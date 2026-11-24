/**
 * Harry's invite templates, and the rules he set for them.
 *
 * Most of this suite is not testing code so much as testing copy: the rules
 * in his document ("don't mention BNI", "no long dashes", "don't mention the
 * cost") are only worth writing down if something checks them, otherwise the
 * next person to edit a template breaks one silently. Pure functions, no
 * database.
 */
import {
  formatMeetingDateForMessage,
  formatNextMeetingDate,
  ordinalSuffix,
} from "../src/lib/meeting-date";
import {
  GRIP_STEPS,
  INVITE_TIPS,
  LINKEDIN_NOTE_LIMIT,
  MESSAGE_RULES,
  MESSAGE_TEMPLATES,
  OUTREACH_GROUP_NAME,
  PODCASTS,
  PODCAST_HOME,
  type ChapterMessageFacts,
  fillTemplate,
  isTradeOpen,
  listTemplates,
  seatKey,
} from "../src/lib/workshop/toolkit";

let pass = 0, fail = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label} ${detail}`); }
}

const facts: ChapterMessageFacts = {
  groupName: OUTREACH_GROUP_NAME,
  venue: "Crewe Hall Hotel & Spa",
  meetingDay: "Thursday",
  meetingStart: "06:45",
  meetingEnd: "08:30",
  meetingDate: "Thursday 26th November",
  memberCount: 36,
  referralTotal: "£5.94 million",
  filledSeats: ["webdesign", "accountant", "itsupportservices"].map(seatKey),
};

const jane = { name: "Jane Fletcher", company: "Fletcher Plumbing" };
const ME = "Ryan McCandless";

const filledAll = MESSAGE_TEMPLATES.map((template) => ({
  template,
  text: fillTemplate(template, jane, ME, facts),
}));

console.log("The date format Harry asked for");
check("the 1st takes st", ordinalSuffix(1) === "st");
check("the 2nd takes nd", ordinalSuffix(2) === "nd");
check("the 3rd takes rd", ordinalSuffix(3) === "rd");
check("the 4th takes th", ordinalSuffix(4) === "th");
// The whole reason this is a function and not a lookup on the last digit.
check("the 11th takes th, not st", ordinalSuffix(11) === "th");
check("the 12th takes th, not nd", ordinalSuffix(12) === "th");
check("the 13th takes th, not rd", ordinalSuffix(13) === "th");
check("the 21st takes st", ordinalSuffix(21) === "st");
check("the 22nd takes nd", ordinalSuffix(22) === "nd");
check("the 23rd takes rd", ordinalSuffix(23) === "rd");
check("the 31st takes st", ordinalSuffix(31) === "st");

// Tuesday 24 November 2026; the next Thursday is the 26th, Harry's own example.
const tuesday = new Date("2026-11-24T09:00:00Z");
check(
  "a Tuesday points at Thursday 26th November",
  formatMeetingDateForMessage("Thursday", tuesday) === "Thursday 26th November",
  String(formatMeetingDateForMessage("Thursday", tuesday)),
);
check(
  "the meeting day itself is today, not next week",
  formatMeetingDateForMessage("Thursday", new Date("2026-11-26T05:00:00Z")) ===
    "Thursday 26th November",
);
check(
  "a Friday rolls to the next one",
  formatMeetingDateForMessage("Thursday", new Date("2026-11-27T09:00:00Z")) ===
    "Thursday 3rd December",
  String(formatMeetingDateForMessage("Thursday", new Date("2026-11-27T09:00:00Z"))),
);
check(
  "crossing into January works",
  formatMeetingDateForMessage("Thursday", new Date("2026-12-29T09:00:00Z")) ===
    "Thursday 31st December",
  String(formatMeetingDateForMessage("Thursday", new Date("2026-12-29T09:00:00Z"))),
);
check("no year in a message date", !/\d{4}/.test(
  formatMeetingDateForMessage("Thursday", tuesday) ?? "2026",
));
check("nonsense day gives nothing", formatMeetingDateForMessage("Blursday") === null);
// The marketing site still wants the year, so the old formatter is untouched.
check(
  "the public formatter still carries the year",
  (formatNextMeetingDate("Thursday", tuesday) ?? "").includes("2026"),
  String(formatNextMeetingDate("Thursday", tuesday)),
);

console.log("\nEvery placeholder gets filled");
for (const { template, text } of filledAll) {
  check(`${template.id} has nothing left in braces`, !/\{\{|\}\}/.test(text),
    (text.match(/\{\{[^}]*\}\}/g) ?? []).join(","));
}
check("a company that is missing still reads",
  fillTemplate(MESSAGE_TEMPLATES[0]!, { name: "Jane", company: null }, ME, facts)
    .includes("your business"));
check("a blank company counts as missing",
  fillTemplate(MESSAGE_TEMPLATES[0]!, { name: "Jane", company: "   " }, ME, facts)
    .includes("your business"));
check("the first name is the first word",
  fillTemplate(MESSAGE_TEMPLATES[0]!, jane, ME, facts).startsWith("Hi Jane,"));
check("a one-word name does not break the first name",
  fillTemplate(MESSAGE_TEMPLATES[0]!, { name: "Cher" }, ME, facts).startsWith("Hi Cher,"));
check("the member signs off with their full name",
  fillTemplate(
    MESSAGE_TEMPLATES.find((t) => t.id === "email-intro")!, jane, ME, facts,
  ).trimEnd().endsWith("Ryan McCandless"));
check("but signs the LinkedIn message with their first name only",
  fillTemplate(
    MESSAGE_TEMPLATES.find((t) => t.id === "linkedin-message")!, jane, ME, facts,
  ).trimEnd().endsWith("\nRyan"));

console.log("\nHarry's rules, on every template");
for (const { template, text } of filledAll) {
  // "Don't mention BNI." The group has a name for a reason.
  check(`${template.id} never says BNI`, !/\bBNI\b/i.test(text));
  check(`${template.id} calls it a referral group`,
    text.includes(OUTREACH_GROUP_NAME));
  check(`${template.id} is not a networking group`, !/networking/i.test(text));
  // "No long dashes. They make messages read as AI-written."
  check(`${template.id} has no em dash`, !text.includes("—"));
  // "Don't mention the cost of visiting."
  check(`${template.id} says nothing about cost`,
    !/\b(free|cost|costs|nothing to pay|no charge|£\d|pay)\b/i.test(
      // The referral total is a figure about the room, not a price.
      text.replace(facts.referralTotal, ""),
    ));
  check(`${template.id} names the real venue`,
    !/crewe hall/i.test(text) || text.includes(facts.venue));
}

console.log("\nFacts come from the chapter, not the prose");
const moved: ChapterMessageFacts = {
  ...facts,
  venue: "Somewhere Else Hotel",
  meetingDay: "Tuesday",
  meetingDate: "Tuesday 1st December",
  meetingStart: "07:00",
  meetingEnd: "08:45",
  memberCount: 41,
};
const movedAll = MESSAGE_TEMPLATES.map((t) => fillTemplate(t, jane, ME, moved)).join("\n");
check("no template still hardcodes the old venue", !/Crewe Hall/i.test(movedAll));
check("no template still hardcodes Thursday", !/Thursday/i.test(movedAll));
check("no template still hardcodes 06:45", !movedAll.includes("06:45"));
check("no template still hardcodes 08:30", !movedAll.includes("08:30"));
check("no template still hardcodes the member count", !/\b36\b/.test(movedAll));
check("the new venue is in there", movedAll.includes("Somewhere Else Hotel"));
check("so is the new member count", movedAll.includes("41"));
check("so are the new timings",
  movedAll.includes("07:00") && movedAll.includes("08:45"));

console.log("\nLinkedIn's 300-character limit");
const note = MESSAGE_TEMPLATES.find((t) => t.id === "linkedin-connect")!;
check("the connection note declares the limit", note.maxLength === LINKEDIN_NOTE_LIMIT);
const shortFill = fillTemplate(note, { name: "Jo", company: "Jo Ltd" }, ME, facts);
check(`a short name fits (${shortFill.length})`, shortFill.length <= LINKEDIN_NOTE_LIMIT);
// A realistic worst case rather than a friendly one: long first name, long
// trading name. If this does not fit, the counter in the UI is the only thing
// standing between a member and a silently truncated note.
const longFill = fillTemplate(
  note,
  { name: "Christopher Fotheringay", company: "Fotheringay Plumbing & Heating Limited" },
  ME,
  facts,
);
check(`a long name and company still fits (${longFill.length})`,
  longFill.length <= LINKEDIN_NOTE_LIMIT, String(longFill.length));
check("the note has no subject line", !note.subject && !shortFill.startsWith("Subject:"));

console.log("\nWhich templates get offered");
check("six templates in all", MESSAGE_TEMPLATES.length === 6);
check("ids are unique",
  new Set(MESSAGE_TEMPLATES.map((t) => t.id)).size === MESSAGE_TEMPLATES.length);
check("an open trade unlocks the empty-seat email",
  listTemplates(facts, { category: "Plumber" }).some((t) => t.id === "email-referral-angle"));
check("a trade already in the room does not",
  !listTemplates(facts, { category: "Web Design" }).some((t) => t.id === "email-referral-angle"));
check("and neither does a trade nobody recorded",
  !listTemplates(facts, {}).some((t) => t.id === "email-referral-angle"));
check("a blank trade counts as not recorded",
  !listTemplates(facts, { category: "   " }).some((t) => t.id === "email-referral-angle"));
check("no referral total takes that email off the list",
  !listTemplates({ ...facts, referralTotal: "" }, { category: "Plumber" })
    .some((t) => t.id === "email-referral-angle"));
check("the other five are always there",
  listTemplates({ ...facts, referralTotal: "" }, {}).length === 5);
check("nothing else is conditional",
  MESSAGE_TEMPLATES.filter((t) => t.openSeatOnly || t.needsReferralTotal).length === 1);

console.log("\nMatching a trade to a seat");
check("punctuation does not matter", seatKey("I.T Support Services") === seatKey("IT support services"));
check("case does not matter", seatKey("Web Design") === seatKey("web design"));
check("trailing space does not matter", seatKey("Surveyor ") === seatKey("Surveyor"));
check("different trades stay different", seatKey("Plasterer") !== seatKey("Plumber"));
check("an open trade reads as open", isTradeOpen("Plumber", facts) === true);
check("a filled trade reads as filled", isTradeOpen("Web Design", facts) === false);
check("a filled trade typed differently still reads as filled",
  isTradeOpen("web  design", facts) === false);
check("nothing recorded is undefined, not false",
  isTradeOpen(null, facts) === undefined && isTradeOpen("", facts) === undefined);
check("punctuation alone is undefined", isTradeOpen("---", facts) === undefined);

console.log("\nThe supporting copy");
check("four GRIP steps", GRIP_STEPS.length === 4);
check("GRIP spells GRIP", GRIP_STEPS.map((s) => s.letter).join("") === "GRIP");
check("six rules", MESSAGE_RULES.length === 6);
check("the rules name the group", MESSAGE_RULES.some((r) => r.includes(OUTREACH_GROUP_NAME)));
check("six tips, so the portal heading stays true", INVITE_TIPS.length === 6);
// The old "Say what it costs" tip told members to do what Harry's rules forbid.
check("no tip tells you to mention the cost",
  !INVITE_TIPS.some((tip) => /cost|free|nothing to pay/i.test(tip.title)));
// The tip that tells members not to say BNI has to be allowed to say it.
// What must not appear is the group being named that way in advice to send.
check("no tip names the group as BNI Dabbers",
  !INVITE_TIPS.some((tip) => /BNI Dabbers/i.test(`${tip.title} ${tip.body}`)));
check("one tip does tell you not to say BNI",
  INVITE_TIPS.some((tip) => /not BNI/i.test(tip.body)));
check("every tip has a body", INVITE_TIPS.every((tip) => tip.body.trim().length > 40));
check("ten podcasts", PODCASTS.length === 10);
check("every podcast link is bnipodcast.com",
  PODCASTS.every((cast) => cast.url.startsWith("https://www.bnipodcast.com/")));
check("episode numbers are unique",
  new Set(PODCASTS.map((c) => c.episode)).size === PODCASTS.length);
check("the category link is there", PODCAST_HOME.startsWith("https://www.bnipodcast.com/"));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
