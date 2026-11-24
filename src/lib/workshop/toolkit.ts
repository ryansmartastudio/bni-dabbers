/**
 * What a member gets when they sit down to invite somebody: words to send,
 * the rules those words follow, and something to listen to on the way in.
 *
 * The templates are Harry's, from "Dabbers - Invite Message Templates",
 * carried across close to verbatim. Where he wrote a fact into the prose --
 * the venue, the timings, the number of members, the referral total -- it is
 * a merge field here instead, because a figure typed into six templates is a
 * figure that goes stale in six places.
 *
 * Templates use {{Name}} style placeholders that the portal fills in before
 * anything is copied, so what lands on the clipboard is ready to send rather
 * than ready to edit.
 */

/**
 * What the group is called in an invitation.
 *
 * Deliberately NOT chapterSettings.chapterName, which is "BNI Dabbers" and is
 * right everywhere else on the site. Harry's rule is that an invite names the
 * group and not BNI: the person receiving it has no idea what BNI is, and
 * "referral group" says what the room actually does.
 */
export const OUTREACH_GROUP_NAME = "Dabbers - The Business Referral Group";

/** LinkedIn's own limit on a connection note. It silently truncates. */
export const LINKEDIN_NOTE_LIMIT = 300;

export type MessageTemplate = {
  id: string;
  channel: "WhatsApp" | "LinkedIn" | "Email";
  label: string;
  hint: string;
  subject?: string;
  body: string;
  /**
   * A hard limit the channel enforces. Checked against the filled message,
   * not the template, because the fields are what push it over.
   */
  maxLength?: number;
  /**
   * Claims there is nobody in the room doing what they do, so it is only
   * honest when that is true. Hidden unless the trade checks out as a seat
   * nobody is sitting in.
   */
  openSeatOnly?: boolean;
  /** Needs a published referral total to make its case. */
  needsReferralTotal?: boolean;
};

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "whatsapp-warm",
    channel: "WhatsApp",
    label: "Someone you know well",
    hint: "Short, friendly and easy to say no to.",
    body: `Hi {{FirstName}}, quick one.

Are you looking to grow {{Company}} over the next year? Would more referrals help you do that?

I'm part of {{GroupName}}. We're local business owners, one per trade, and we pass each other work every week.

If I can get you a place on our invite list, would you like to meet me at {{Venue}} on {{MeetingDate}} and see if it could help you?

If it's not for you, no problem at all.`,
  },
  {
    id: "whatsapp-nudge",
    channel: "WhatsApp",
    label: "Following up",
    hint: "For when the first message went quiet.",
    body: `Hi {{FirstName}}, just checking you saw my message about joining me at {{GroupName}} on {{MeetingDate}}.

Happy to tell you more, or leave it with you. Either is absolutely fine.`,
  },
  {
    id: "linkedin-connect",
    channel: "LinkedIn",
    label: "Connection note",
    hint: "Must stay under LinkedIn's 300-character limit once the fields are filled in.",
    maxLength: LINKEDIN_NOTE_LIMIT,
    body: `Hi {{FirstName}}, I've seen the work {{Company}} does locally. I'm part of {{GroupName}}, which meets on {{MeetingDay}} mornings, and I can bring a guest. Would be good to connect either way.`,
  },
  {
    id: "linkedin-message",
    channel: "LinkedIn",
    label: "Message to a connection",
    hint: "A bit more room to explain it.",
    body: `Hi {{FirstName}},

Are you looking to grow {{Company}}, and would more referrals help you get there?

I'm part of {{GroupName}}, which meets on {{MeetingDay}} mornings at {{Venue}}. It's {{MemberCount}} local business owners, one per trade, and the whole thing runs on passing each other work. It has been a huge benefit to me and my business.

If I can secure you a place on our invite list, would you like to meet me at {{Venue}} on {{MeetingDate}} and find out if it can make the same difference for you?

{{MemberFirstName}}`,
  },
  {
    id: "email-intro",
    channel: "Email",
    label: "First approach",
    hint: "For someone you know a little less well.",
    subject: "{{MeetingDay}} morning breakfast – thought of you",
    body: `Hi {{FirstName}},

Are you looking to grow {{Company}}? If so, would more referrals help you do that?

I'm a member of {{GroupName}}, which meets every {{MeetingDay}} morning at {{Venue}}. There are {{MemberCount}} of us, one business per trade, passing each other referrals.

If I can secure you a place on our invite list, would you like to meet me there on {{MeetingDate}} to find out if it could help you? It's an early start, breakfast at {{MeetingStart}} and finished by {{MeetingEnd}}, and there's no expectation to join.

I'd be glad to meet you there and introduce you around.

Best,
{{MemberName}}`,
  },
  {
    id: "email-referral-angle",
    channel: "Email",
    label: "Leading with the referrals",
    hint: "When the business case will land better than the social one. Only offered when their trade is a seat nobody is sitting in.",
    subject: "An introduction to a room of local business owners",
    openSeatOnly: true,
    needsReferralTotal: true,
    body: `Hi {{FirstName}},

Quick one. Are you looking to grow {{Company}}, and would more referrals help?

I'm part of {{GroupName}}, a room of local business owners. In the last 12 months our members have passed each other {{ReferralTotal}} of business. At the moment there's nobody in the room doing what {{Company}} does.

If I can secure you a place on our invite list, would you like to meet me at {{Venue}} on {{MeetingDate}} to see if it could help you? It's a breakfast meeting and there's no obligation to join.

Best,
{{MemberName}}`,
  },
];

/**
 * The chapter facts the templates need, resolved once on the server.
 *
 * Every one of these is already public on the marketing site, which is why
 * the workshop portal can be handed the same object without leaking anything
 * the password does not already cover.
 */
export type ChapterMessageFacts = {
  /** "Dabbers - The Business Referral Group". */
  groupName: string;
  /** "Crewe Hall Hotel & Spa". */
  venue: string;
  /** "Thursday". */
  meetingDay: string;
  /** "06:45". */
  meetingStart: string;
  /** "08:30". */
  meetingEnd: string;
  /** "Thursday 26th November" -- no year, per Harry's rule. */
  meetingDate: string;
  /** Active members, which is what "one per trade" counts. */
  memberCount: number;
  /**
   * "£5.94 million", or empty when the chapter publishes no figure. Empty
   * takes the template that leans on it off the list rather than shipping a
   * sentence with a hole in it.
   */
  referralTotal: string;
  /**
   * Seat keys the room already has somebody sitting in. Travels with the
   * facts so one object answers both questions a template asks: what to say,
   * and whether it is honest to say it.
   */
  filledSeats: string[];
};

/**
 * Seats are typed by hand in two places -- the member roster and the workshop
 * board -- so "I.T Support Services" and "IT support services" have to meet.
 */
export function seatKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * Whether a trade is a seat nobody is sitting in.
 *
 * Three-valued on purpose. Undefined means there was nothing to check -- a
 * visitor with no trade recorded -- and that is treated the same as "no",
 * because "there's nobody in the room doing what you do" is a claim the
 * member has to defend in person.
 */
export function isTradeOpen(
  category: string | null | undefined,
  facts: Pick<ChapterMessageFacts, "filledSeats">,
): boolean | undefined {
  const key = seatKey(category ?? "");
  if (!key) return undefined;
  return !facts.filledSeats.includes(key);
}

export type MessageAudience = {
  name: string;
  company?: string | null;
};

/**
 * Fills the placeholders so what lands on the clipboard is ready to send.
 *
 * Lives beside the templates rather than in a component, because both the
 * workshop portal and the CRM send these and two copies of this function
 * would drift -- which is exactly what happened with the contact-picker
 * capability test.
 */
export function fillTemplate(
  template: MessageTemplate,
  person: MessageAudience,
  me: string,
  facts: ChapterMessageFacts,
): string {
  const trimmedPerson = person.name.trim();
  const trimmedMe = me.trim();
  const source = template.subject
    ? `Subject: ${template.subject}\n\n${template.body}`
    : template.body;

  return source
    .replaceAll("{{FirstName}}", firstNameOf(trimmedPerson))
    .replaceAll("{{Name}}", trimmedPerson)
    // Every template builds a sentence around this, so an empty company has
    // to become something that still reads: "what you do at ." is worse than
    // no message at all.
    .replaceAll("{{Company}}", person.company?.trim() || "your business")
    .replaceAll("{{MemberName}}", trimmedMe)
    .replaceAll("{{MemberFirstName}}", firstNameOf(trimmedMe))
    .replaceAll("{{GroupName}}", facts.groupName)
    .replaceAll("{{Venue}}", facts.venue)
    .replaceAll("{{MeetingDay}}", facts.meetingDay)
    .replaceAll("{{MeetingStart}}", facts.meetingStart)
    .replaceAll("{{MeetingEnd}}", facts.meetingEnd)
    .replaceAll("{{MeetingDate}}", facts.meetingDate)
    .replaceAll("{{MemberCount}}", String(facts.memberCount))
    .replaceAll("{{ReferralTotal}}", facts.referralTotal);
}

function firstNameOf(full: string): string {
  return full.split(/\s+/)[0] ?? full;
}

/**
 * Which templates a member should actually be offered, given who they are
 * writing to.
 *
 * Two templates can drop off: the one that claims an empty seat, when the
 * trade is already in the room or was never recorded, and the one that
 * quotes the referral total, when the chapter publishes no figure.
 */
export function listTemplates(
  facts: ChapterMessageFacts,
  options: { category?: string | null } = {},
): MessageTemplate[] {
  const open = isTradeOpen(options.category, facts);
  return MESSAGE_TEMPLATES.filter((template) => {
    if (template.openSeatOnly && open !== true) return false;
    if (template.needsReferralTotal && !facts.referralTotal) return false;
    return true;
  });
}

/** The ordering question behind every first approach. */
export const GRIP_STEPS = [
  {
    letter: "G",
    title: "Grow",
    body: "Are you looking to grow your business? Start here and the rest of the message has a reason to exist.",
  },
  {
    letter: "R",
    title: "Referrals",
    body: "Would more referrals help you do that? Their answer tells you whether to keep going.",
  },
  {
    letter: "I",
    title: "Invite",
    body: "I can secure you a place on our invite list. A place held for them, not a meeting they have to find.",
  },
  {
    letter: "P",
    title: "Place",
    body: "Meet me at the venue and find out if it can help you. Name the place, name the date, be there.",
  },
] as const;

/** Harry's rules for all templates, as they appear in his document. */
export const MESSAGE_RULES = [
  `Call the group ${OUTREACH_GROUP_NAME}. Don't mention BNI.`,
  "Call it a referral group, not a networking group.",
  "No long dashes in any message. They make messages read as AI-written.",
  "Don't mention the cost of visiting.",
  "Dates are written as Thursday 26th November, with no year.",
  "First approaches follow GRIP: grow, referrals, invite, place.",
] as const;

export type Podcast = {
  episode: string;
  title: string;
  url: string;
  summary: string;
};

/** Where the rest of them live. */
export const PODCAST_HOME = "https://www.bnipodcast.com/category/visitors/";

/**
 * From bnipodcast.com's Visitors category. Every one of these was read off the
 * site rather than recalled, so the numbers and links go where they say.
 */
export const PODCASTS: Podcast[] = [
  {
    episode: "985",
    title: "Give Me 15 Seconds to Change Your Life",
    url: "https://www.bnipodcast.com/2026/11/04/episode-985-give-me-15-seconds-to-change-your-life/",
    summary: "Guidelines for inviting visitors, and why the invitation is worth making at all.",
  },
  {
    episode: "984",
    title: "Turning the Tables on Inviting",
    url: "https://www.bnipodcast.com/2026/10/28/episode-984-turning-the-tables-on-inviting/",
    summary: "Spotting the everyday cues that make inviting easy, starting with people who already ask you for business.",
  },
  {
    episode: "950",
    title: "The Growth Mindset",
    url: "https://www.bnipodcast.com/2026/03/04/episode-950-the-growth-mindset/",
    summary: "How John Rivers invited and followed up his way to sponsoring 51 new members.",
  },
  {
    episode: "944",
    title: "Don't Let Your Group Deflate While You Wait (Classic)",
    url: "https://www.bnipodcast.com/2026/01/21/episode-944-dont-let-your-group-deflate-while-you-wait-classic/",
    summary: "Dr Misner answers the excuses chapters give for not inviting visitors.",
  },
  {
    episode: "911",
    title: "Why I Invited My Competition",
    url: "https://www.bnipodcast.com/2025/05/21/episode-911-why-i-invited-my-competition/",
    summary: "Why inviting a competitor to visit turned out to help everyone involved.",
  },
  {
    episode: "874",
    title: "Small Acts Equal Big Results",
    url: "https://www.bnipodcast.com/2024/08/21/episode-874-small-acts-equal-big-results/",
    summary: "A strategic approach: identify the missing profession, research it, then invite, which is exactly what the pipeline is for.",
  },
  {
    episode: "837",
    title: "Sponsoring 52 Members in 3½ Years",
    url: "https://www.bnipodcast.com/2023/11/29/episode-837-sponsoring-52-members-in-3%c2%bd-years/",
    summary: "The social media and scripts behind 200+ visitors and 52 sponsored members.",
  },
  {
    episode: "830",
    title: "Inviting Visitors Through Social Media",
    url: "https://www.bnipodcast.com/2023/10/11/episode-830-inviting-visitors-through-social-media/",
    summary: "Using social media to invite visitors by targeting contact-sphere professions.",
  },
  {
    episode: "785",
    title: "Inviting to BNI is Child's Play",
    url: "https://www.bnipodcast.com/2022/11/23/inviting-to-bni-is-childs-play/",
    summary: "Keep it simple, and invite people to visit rather than to join.",
  },
  {
    episode: "962",
    title: "Time and Money (Classic)",
    url: "https://www.bnipodcast.com/2026/05/27/episode-962-time-and-money-classic/",
    summary: "For the visitor who hesitates over the cost in time and money.",
  },
];

export const INVITE_TIPS = [
  {
    title: "Ask about growth before you mention the group",
    body: "“Are you looking to grow, and would more referrals help?” earns you the right to say the next sentence. Lead with the group instead and you are selling something nobody asked about.",
  },
  {
    title: "Invite them to visit, not to join",
    body: "The ask is one breakfast, not a membership. People say yes to a coffee and a look round far more readily than to a commitment, and the room does the rest.",
  },
  {
    title: "Call it a referral group",
    body: "Not a networking group, and not BNI. A referral group says what happens in the room: business owners passing each other work. The other two say nothing, or say something they will have to look up.",
  },
  {
    title: "Give them a date and an out",
    body: "Name the actual Thursday and make it easy to decline. A clear no now is worth more than a vague maybe you chase for a fortnight.",
  },
  {
    title: "Leave money out of it",
    body: "Don't raise the cost of visiting. Bringing it up unprompted makes the money the subject, and the subject is whether the room can help them grow. If they ask, answer it straight.",
  },
  {
    title: "Offer to meet them at the door",
    body: "Walking in alone at 06:45 is the hardest part for a guest. Saying you will be there to meet them removes the last reason to back out.",
  },
];
