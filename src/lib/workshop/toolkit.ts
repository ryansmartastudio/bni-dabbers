/**
 * What a member gets once they claim a contact: something to say, and
 * something to listen to on the way to work.
 *
 * Templates use {{Name}} style placeholders that the portal fills in from the
 * contact before it is copied, so the text on the clipboard is ready to send
 * rather than ready to edit.
 */

export type MessageTemplate = {
  id: string;
  channel: "WhatsApp" | "LinkedIn" | "Email";
  label: string;
  hint: string;
  subject?: string;
  body: string;
};

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "whatsapp-warm",
    channel: "WhatsApp",
    label: "Someone you know well",
    hint: "Short, no pitch, easy to say no to.",
    body: `Morning {{FirstName}} — quick one.

I'm part of a business networking group in Crewe called BNI Dabbers. We meet Thursday mornings and I get to bring a guest.

Thought of you because of what you do at {{Company}}. No pressure and nothing to pay — just a chance to meet some local business owners over breakfast.

Fancy it? Next one's {{MeetingDate}}.`,
  },
  {
    id: "whatsapp-nudge",
    channel: "WhatsApp",
    label: "Following up",
    hint: "For when the first message went quiet.",
    body: `Hi {{FirstName}}, no worries if it's not for you — just wanted to check you'd seen my message about the Thursday networking thing.

Happy to tell you more, or leave it with you. Either's fine.`,
  },
  {
    id: "linkedin-connect",
    channel: "LinkedIn",
    label: "Connection note",
    hint: "Under 300 characters, which LinkedIn enforces.",
    body: `Hi {{FirstName}} — we're both local and I come across {{Company}} regularly. I'm in a Crewe business networking group and can bring a guest to our Thursday meeting. Thought it might be worth a conversation either way.`,
  },
  {
    id: "linkedin-message",
    channel: "LinkedIn",
    label: "Message to a connection",
    hint: "A bit more room to explain it.",
    body: `Hi {{FirstName}},

I'm part of BNI Dabbers, a referral group that meets Thursday mornings at Crewe Hall. It's business owners across about 35 different trades, and the whole thing runs on passing each other work.

We've got room to bring guests and I thought of {{Company}}. It's a breakfast, it's free to visit, and there's no obligation beyond turning up.

Would you like me to put your name down for {{MeetingDate}}?`,
  },
  {
    id: "email-intro",
    channel: "Email",
    label: "First approach",
    hint: "For someone you know a little less well.",
    subject: "Thursday morning in Crewe — thought of you",
    body: `Hi {{FirstName}},

I'm a member of BNI Dabbers, a business networking group that meets every Thursday morning at Crewe Hall. Around 35 local business owners, one per trade, passing each other referrals.

I'm able to invite a guest and thought of {{Company}}. It's an early start — 06:45 for breakfast, done by 08:30 — and visiting costs nothing.

If you'd like to come along, the next one is {{MeetingDate}} and I'd be glad to meet you there and introduce you around.

Best,
{{MyName}}`,
  },
  {
    id: "email-referral-angle",
    channel: "Email",
    label: "Leading with the referrals",
    hint: "When the business case will land better than the social one.",
    subject: "An introduction to a room of local business owners",
    body: `Hi {{FirstName}},

Quick one. I'm part of a referral group in Crewe — BNI Dabbers — and over the last twelve months the members have passed each other several million pounds of work between them.

There's no one doing what {{Company}} does in the room at the moment, which is usually a good sign it's worth a look.

Guests are welcome on Thursday mornings and there's no cost to visit. Next one is {{MeetingDate}}. Would you like me to save you a seat?

Best,
{{MyName}}`,
  },
];

export type Podcast = {
  episode: string;
  title: string;
  url: string;
  summary: string;
};

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
    summary: "Spotting the everyday cues that make inviting easy — starting with people who already ask you for business.",
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
    summary: "A strategic approach: identify the missing profession, research it, then invite — which is exactly what today's list is.",
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
    title: "Invite them to visit, not to join",
    body: "The ask is one breakfast, not a membership. People say yes to a coffee and a look round far more readily than to a commitment, and the room does the rest.",
  },
  {
    title: "Lead with why you thought of them",
    body: "“I thought of you because…” beats any description of BNI. It is a compliment, it is specific, and it explains why they are getting the message.",
  },
  {
    title: "Give them a date and an out",
    body: "Name the actual Thursday and make it easy to decline. A clear no now is worth more than a vague maybe you chase for a fortnight.",
  },
  {
    title: "Say what it costs",
    body: "Nothing to visit, and breakfast included. Leaving it unsaid makes people assume a pitch is coming.",
  },
  {
    title: "Follow up once, properly",
    body: "One nudge a few days later catches most of the people who meant to reply and forgot. A second nudge rarely helps.",
  },
  {
    title: "Offer to meet them at the door",
    body: "Walking in alone at 06:45 is the hardest part for a guest. Saying you will be there to meet them removes the last reason to back out.",
  },
];
