import type { NewPage } from "../../src/db/schema";

type SeedPage = Omit<NewPage, "id" | "createdAt" | "updatedAt">;

export const ARTICLE_PAGES: SeedPage[] = [
  {
    slug: "referral-follow-up-tips",
    kind: "article",
    locationName: null,
    title: "Five referral follow-up habits that protect your reputation",
    metaTitle: "Referral follow-up tips | BNI Dabbers insights",
    metaDescription:
      "What to do after you receive a BNI referral: five follow-up habits that protect the referrer's trust and bring you more introductions.",
    heroEyebrow: "Referrals",
    heroImageUrl: null,
    intro:
      "A referral is someone lending you their reputation. How you follow up decides whether they ever do it again. These are the five habits we see in members who receive referrals week after week.",
    sections: [
      {
        id: "rf-why",
        heading: "The referral is only half the job",
        body: `When a fellow member passes you a referral, they are doing more than handing over a phone number. They have told someone they know, often a client, a friend or a supplier, that you are worth their time. If you are slow, vague or forget to call, the person who looks bad is the referrer.

That is why follow-up matters so much in a referral group. Most members do not stop referring because a lead failed to convert. They stop because they never heard what happened, or because the prospect told them nobody got back in touch.

The good news is that strong follow-up is not complicated. It comes down to a handful of habits, done consistently.`,
      },
      {
        id: "rf-1",
        heading: "1. Make contact within one working day",
        body: `Speed is the clearest signal that you value the introduction. Aim to make first contact within one working day, and the same day if you can.

A few practical points:

- **Use the channel the referrer suggested.** If they said "give her a ring", ring. If they said the prospect prefers email, email.
- **Mention the referrer by name in your first sentence.** "Hi Sarah, Tom from our BNI group suggested I get in touch about your insurance renewal" is far warmer than a generic introduction.
- **If you cannot help, say so quickly.** A fast, honest "this is outside what we do, but here is who I would call" protects everyone.

If you are away or at capacity, tell the referrer straight away so they can manage expectations.`,
      },
      {
        id: "rf-2",
        heading: "2. Tell the referrer what happened",
        body: `The referrer should never have to chase you. Once you have spoken to the prospect, send a short message back:

> "Spoke to Sarah this morning. Lovely conversation, sending a quote on Friday. Thanks again for thinking of me."

It takes thirty seconds, and it does three things. It shows you acted. It means the referrer is not caught off guard if the prospect mentions you. And it reminds them, gently, that you are someone who looks after their contacts.

Do this privately and before the next weekly meeting. Nobody wants to learn in front of the room that a referral they passed has gone quiet.`,
      },
      {
        id: "rf-3",
        heading: "3. Set clear expectations with the prospect",
        body: `A referred prospect usually arrives with a level of goodwill a cold enquiry does not have. Do not spend it carelessly.

In your first conversation, be clear about:

- what happens next and when
- roughly what the work involves and costs, as early as you reasonably can
- who they will be dealing with day to day

If something changes, a delay, a price revision or a capacity issue, tell them before they have to ask. A referral that turns into a poor experience does more damage than no referral at all, because it reflects on the person who recommended you.`,
      },
      {
        id: "rf-4",
        heading: "4. Treat a 'no' as professionally as a 'yes'",
        body: `Not every referral becomes business, and that is fine. The prospect might not be ready, might choose someone else on price, or might simply not be a fit.

What matters is how you handle it. Thank the prospect for their time, leave the door open, and let the referrer know the outcome without any sense of blame. "Not the right time for them, but I have offered to check in again in the spring" is a perfectly good update.

Members notice who handles disappointment gracefully. It is often the person who takes a "no" well who gets the next introduction.`,
      },
      {
        id: "rf-5",
        heading: "5. Close the loop with a thank you",
        body: `When a referral does turn into paid work, record it. In BNI this is called **TYFCB, Thank You For Closed Business**. Logging it is how the chapter measures the value its members create for each other. At {{chapterName}}, that figure currently stands at **{{tyfcbHeadline}}** over the last 12 months.

Recording closed business is not about showing off. It teaches the room what a good referral looks like for you, which makes the next one more likely to be the right kind. A public thank you in the meeting, where appropriate, recognises the member who trusted you.

And if a referral turns into a long-term client, keep the referrer in the picture over time. A quick note six months later saying the relationship is still going well is the kind of thing people remember.`,
      },
      {
        id: "rf-routine",
        heading: "A simple follow-up routine",
        body: `If you want to make these habits stick, build them into a routine:

1. **Same day:** acknowledge the referral to the referrer and make first contact with the prospect.
2. **Within a week:** send the referrer a short update on where things stand.
3. **On outcome:** let the referrer know the result, win or lose.
4. **When it closes:** log the TYFCB and say thank you, privately and in the room.
5. **Every few months:** check in on any long-running work that came from a referral.

None of this needs special software. A note on your phone or a column in your CRM is enough. What matters is that you do it every time, because consistency is what turns a single referral into a reliable stream of them.

If you want to see how this works in a live chapter, [read how BNI referrals work](/how-bni-referrals-work) or come along to a {{meetingDay}} meeting as our guest.`,
      },
    ],
    faqs: [
      {
        question: "How quickly should I contact a referral?",
        answer:
          "Within one working day, and the same day if you can. If you are away or at capacity, tell the referrer straight away so they can let the prospect know.",
      },
      {
        question: "What is TYFCB in BNI?",
        answer:
          "TYFCB stands for Thank You For Closed Business. Members record it when a referral turns into paid work, which lets the chapter track the value members create for each other.",
      },
      {
        question: "What if a referral is not a good fit for my business?",
        answer:
          "Say so quickly and politely, and suggest someone better placed to help if you can. Then let the referrer know, so they understand the kind of introduction that works best for you.",
      },
    ],
    ctaHeading: "See referral culture in action",
    ctaBody:
      "Visit a {{meetingDay}} morning meeting at {{venueName}} and see how members pass, track and thank each other for referrals.",
    published: true,
    publishedAt: new Date("2026-09-01T09:00:00.000Z"),
    excerpt:
      "A referral is someone lending you their reputation. Five habits that keep the referrer's trust and bring the next introduction.",
    sortOrder: 300,
  },
  {
    slug: "cheshire-east-business-outlook",
    kind: "article",
    locationName: null,
    title: "Why local referrals work so well for Cheshire East businesses",
    metaTitle: "Local referrals for Cheshire East businesses | BNI Dabbers",
    metaDescription:
      "Why trusted, local referrals suit businesses in Crewe, Nantwich, Sandbach and across Cheshire East, and how a weekly networking group helps you tap into them.",
    heroEyebrow: "Local business",
    heroImageUrl: null,
    intro:
      "Cheshire East is a region of market towns, villages and close-knit business communities. That shape makes it one of the best places in the country to grow through **trusted, local referrals**.",
    sections: [
      {
        id: "ceo-patchwork",
        heading: "A patchwork of towns, not one big city",
        body: `Unlike a city centre economy, Cheshire East is spread across a string of towns, each with its own character: Crewe, Nantwich, Sandbach, Alsager, Congleton, Middlewich and many villages in between. Plenty of businesses here serve customers across several of them.

That creates a particular challenge. There is no single business district where everyone bumps into each other, and generic advertising tends to be spread thin across a wide, mixed area. A plumber in Wistaston, an accountant in Nantwich and a solicitor in Sandbach might share dozens of potential clients without ever meeting.

A referral network solves that problem by bringing owners from across the area into one room, every week.`,
      },
      {
        id: "ceo-trust",
        heading: "Trust travels faster in smaller markets",
        body: `In a region like ours, reputation counts. People ask friends, neighbours and the professionals they already use for recommendations before they search online, especially for anything high-value or personal: a solicitor, a financial adviser, a builder, a mortgage broker.

A recommendation from someone they already trust carries weight that no advert can match. It also tends to bring better clients. A referred customer has usually heard what you do, how you work and roughly what to expect before they pick up the phone.

That is the core of how BNI works. Members get to know each other's businesses in depth and then recommend each other to the people in their own networks. Across the last 12 months, {{chapterName}} members have passed **{{tyfcbHeadline}}** of closed business to one another, verified through BNI Connect in {{tyfcbVerified}}.`,
      },
      {
        id: "ceo-central",
        heading: "One central meeting point for the whole area",
        body: `Geography matters for a weekly commitment. {{chapterName}} meets every {{meetingDay}} from {{meetingTimeRange}} at {{venueName}}, which sits centrally for owners based in [Crewe](/networking-groups/crewe), [Nantwich](/networking-groups/nantwich), [Sandbach](/networking-groups/sandbach), Alsager and the surrounding villages.

The early start is deliberate. Most members are back at their desks, or on site, before the working day properly begins, so the meeting does not eat into client time.

Because members come from across the borough, a single chapter gives you reach into towns you might not otherwise have contacts in. Your referral partners are not just the people in the room, but everyone they know in their own corner of Cheshire East.`,
      },
      {
        id: "ceo-practice",
        heading: "What referral-led growth looks like in practice",
        body: `Growing through referrals is steady rather than sudden. In practice it tends to look like this:

- **The first few months are about learning.** Members get to know what you do and who your ideal client is, and you learn the same about them.
- **Introductions start small.** Often a first referral is a fellow member using your services themselves, or a contact with a straightforward need.
- **Momentum builds.** As members see you look after their contacts well, they refer with more confidence and to more valuable relationships.

The businesses that do best are usually the ones that treat it as a long-term relationship, not a quick lead source. That means turning up consistently, learning about other members' businesses, and actively looking for ways to help them too. BNI calls this **Givers Gain**.`,
      },
      {
        id: "ceo-online",
        heading: "Where online marketing still fits",
        body: `Referrals are not a replacement for everything else. A good website, an up-to-date Google Business Profile and a sensible social media presence all still matter, because a referred prospect will almost always look you up before they get in touch.

The difference is what each channel does best. Online marketing is good at being found. Referrals are good at being trusted. A local referral group gives you a reliable source of warm introductions, while your online presence reassures those prospects that they are dealing with a credible business.

Many members find the two work together: a referral gets their name in front of someone, and their website and reviews do the rest.`,
      },
      {
        id: "ceo-start",
        heading: "Getting started locally",
        body: `If you run a business anywhere in Cheshire East and want more of your work to come from trusted introductions, the easiest first step is to see a chapter in action.

- [Browse the member directory](/directory) to see the businesses already in the room.
- Check the [open seats](/open-seats). BNI allows one member per profession, so it is worth checking whether your category is available.
- [Request a guest visit](/visit) and come along to a {{meetingDay}} morning meeting.

There is no obligation to join. Most guests simply want to understand how it works and whether it suits their business, and that is exactly what a visit is for.`,
      },
    ],
    faqs: [
      {
        question: "Which towns does BNI Dabbers cover?",
        answer:
          "Members come from across Cheshire East, including Crewe, Nantwich, Sandbach, Alsager, Congleton, Middlewich and the surrounding villages. The chapter meets centrally at {{venueName}}.",
      },
      {
        question: "Do I need to be based in Crewe to join?",
        answer:
          "No. Members are based throughout Cheshire East and neighbouring areas. What matters is that you can attend the weekly {{meetingDay}} morning meeting.",
      },
      {
        question: "How long does it take for referrals to come in?",
        answer:
          "It varies by business. Most members find the first few months are about building relationships, with referrals growing as other members get to know and trust their work.",
      },
    ],
    ctaHeading: "Meet business owners from across Cheshire East",
    ctaBody:
      "Join us on a {{meetingDay}} morning at {{venueName}} and see how local referrals work in practice.",
    published: true,
    publishedAt: new Date("2026-09-08T09:00:00.000Z"),
    excerpt:
      "Market towns, close-knit communities and a premium on trust: why Cheshire East is ideal territory for referral-led growth.",
    sortOrder: 310,
  },
  {
    slug: "guest-visit-checklist",
    kind: "article",
    locationName: null,
    title: "Guest visit checklist for first-time BNI visitors",
    metaTitle: "BNI guest visit checklist | BNI Dabbers",
    metaDescription:
      "Everything to prepare before your first BNI Dabbers guest visit: travel, what to bring, your short introduction and the questions worth asking.",
    heroEyebrow: "Guest visits",
    heroImageUrl: null,
    intro:
      "Visiting a BNI chapter for the first time is easier when you know what to expect. Use this checklist the night before your **guest visit** and you will walk in relaxed, prepared and ready to make the most of the morning.",
    sections: [
      {
        id: "gvc-before",
        heading: "The night before",
        body: `A little preparation goes a long way, especially with an early start.

- **Confirm the details.** {{chapterName}} meets every {{meetingDay}} from {{meetingTimeRange}} at {{venueName}}, {{venueAddress}}.
- **Plan your route and parking.** Allow extra time on your first visit so you are not rushing in.
- **Know who to ask for.** Your confirmation email will tell you who is expecting you. If in doubt, ask at reception for the BNI meeting and someone will look after you.
- **Choose what to wear.** There is no strict dress code. Dress as you would for a meeting with a new client.

Set an alarm with a little slack. Arriving a few minutes early is one of the best things you can do, because the open networking at the start is where many of the most useful conversations happen.`,
      },
      {
        id: "gvc-bring",
        heading: "What to bring",
        body: `Keep it simple:

- **Business cards.** Bring more than you think you need. Members often swap cards with guests and pass them on to contacts.
- **Your phone,** with your LinkedIn profile easy to find, so you can connect with people on the spot.
- **A pen and notepad,** or a notes app. You will hear a lot of businesses introduce themselves and it helps to jot down anyone you could work with.

You do not need brochures, samples or a presentation. The morning is about conversations, not sales material.`,
      },
      {
        id: "gvc-intro",
        heading: "Prepare a short introduction",
        body: `At some point during the meeting, guests are usually invited to introduce themselves. It is short, informal and nobody expects polish. A clear, simple introduction is far more effective than a clever one.

Try covering four things:

1. **Who you are and your business.**
2. **Who you help.** Be specific: "independent retailers" is better than "businesses".
3. **The problem you solve** for them.
4. **Where you work.** Local, regional or national.

For example:

> "I'm Emma from Weaver Landscapes. I design and build gardens for homeowners around Nantwich and Crewe who want an outdoor space they will actually use, without the hassle of managing trades themselves."

Practise it out loud a couple of times. If you can say it in under thirty seconds, you have got it about right.`,
      },
      {
        id: "gvc-morning",
        heading: "On the morning",
        body: `Here is roughly what to expect, so nothing catches you off guard.

**Open networking.** People arrive from {{meetingStart}}, get a coffee and chat. This is the most relaxed part of the morning. Introduce yourself, ask people what they do, and listen more than you talk.

**The structured meeting.** Once everyone is seated, the meeting follows a set agenda. Each member gives a short presentation about their business and the kind of referral they are looking for that week. There is usually a longer presentation from one member, and time for referrals and thank-yous.

**Your introduction.** When invited, give the short introduction you prepared. That is all you need to do.

While members are speaking, note anyone you could help or who could help you. Those notes make your follow-up much easier.

For a fuller run-through, see [what to expect as a BNI visitor](/what-to-expect-as-a-visitor).`,
      },
      {
        id: "gvc-questions",
        heading: "Questions worth asking",
        body: `A guest visit is your chance to work out whether BNI suits your business. Good questions to ask members include:

- "How long have you been a member, and what difference has it made?"
- "What kind of referrals do you typically receive?"
- "How much time does membership take each week outside the meeting?"
- "Is my category available?" You can also check the [open seats](/open-seats) beforehand.
- "What would you do differently if you were joining again?"

Members are generally very open about what works and what does not. Honest answers to these questions will tell you more than any brochure.`,
      },
      {
        id: "gvc-after",
        heading: "After the meeting",
        body: `The visit does not end when you leave the room.

- **Connect on LinkedIn** with the people you spoke to, ideally the same day, with a short personal note.
- **Follow up with anyone you could help.** If you heard a member asking for an introduction you can make, make it. Nothing creates goodwill faster.
- **Ask about next steps** if you are interested in joining. Someone from the membership team will be happy to explain the process and answer any questions.

And if it was not quite right for you, that is fine too. Plenty of guests come back later when the timing suits their business better.

Ready to book? [Request a guest visit](/visit) and we will confirm your place by email.`,
      },
    ],
    faqs: [
      {
        question: "What time should I arrive for my guest visit?",
        answer:
          "Open networking starts at {{meetingStart}}. Arriving a few minutes early gives you time to settle in and chat before the structured meeting begins.",
      },
      {
        question: "Do I have to give a presentation as a guest?",
        answer:
          "No. Guests are usually invited to give a short introduction of who they are and what they do. Thirty seconds is plenty.",
      },
      {
        question: "Is there any obligation to join after visiting?",
        answer:
          "None at all. A guest visit is a chance to see how the chapter works and decide whether it suits your business.",
      },
    ],
    ctaHeading: "Book your guest visit",
    ctaBody:
      "Request a guest place online and we will confirm your {{meetingDay}} morning visit by email.",
    published: true,
    publishedAt: new Date("2026-09-15T09:00:00.000Z"),
    excerpt:
      "Travel, what to bring, your short introduction and the questions worth asking before your first {{meetingDay}} morning meeting.",
    sortOrder: 320,
  },
  {
    slug: "one-seat-per-category",
    kind: "article",
    locationName: null,
    title: "Why one seat per category changes referral quality",
    metaTitle: "One member per category: BNI explained | BNI Dabbers",
    metaDescription:
      "BNI allows one member per profession in each chapter. Here is how the one-seat rule works, why it makes referrals clearer and what to do if your category is taken.",
    heroEyebrow: "How BNI works",
    heroImageUrl: null,
    intro:
      "Every BNI chapter allows just **one member per professional category**. It is one of the rules people ask about most, and it is a big part of why BNI referrals work. Here is how it works and what it means for you.",
    sections: [
      {
        id: "osc-what",
        heading: "What the rule actually means",
        body: `In a BNI chapter, each profession has one seat. There is one accountant, one electrician, one mortgage adviser, one web designer, and so on. Once a seat is filled, nobody else in that category can join that chapter while the member holds it.

That is quite different from most networking events, where you might find three financial advisers and two estate agents in the same room, all chasing the same contacts.

In BNI, the member holding a seat effectively represents that profession for the whole chapter. When anyone in the room meets someone who needs that service, there is no question about who to recommend.`,
      },
      {
        id: "osc-clarity",
        heading: "Why it makes referrals clearer",
        body: `Think about it from the referrer's side. If you knew three accountants equally well, recommending one would feel awkward, and you might avoid it altogether rather than upset the other two.

With one seat per category, that hesitation disappears. Members know exactly who to call, so they refer more often and with more confidence.

It also changes how members get to know each other. Instead of competing for attention, each member can focus on teaching the room about their business in depth: the clients they work best with, the problems they solve and the phrases that signal someone needs their help. That depth is what turns casual introductions into strong, qualified referrals.`,
      },
      {
        id: "osc-commitment",
        heading: "Why it raises the bar for members",
        body: `Holding a seat is a responsibility. When you are the only person in your profession, the rest of the chapter is trusting you with every opportunity in that category. If you are slow to follow up or deliver poor work, there is nobody else for members to turn to.

That is why BNI expects members to attend consistently, look after the referrals they receive, and refer generously in return. Members who do not engage risk losing the seat, so it can be offered to someone who will.

For you as a member, that commitment is reassuring. Everyone else in the room has made the same promise, so the referrals you receive come from people who take the process seriously.`,
      },
      {
        id: "osc-categories",
        heading: "How categories are defined",
        body: `Categories are often more specific than people expect. Where a profession covers very different types of work, a chapter can treat specialisms as separate seats.

Legal services are a good example. At {{chapterName}}, family law and employment law are held by different members. Each solicitor focuses on a different type of client, so there is no conflict and both can refer freely.

The same can apply across finance, property, marketing and construction trades. If your work is clearly distinct from an existing member's, there may still be room for you. The membership committee looks at overlap case by case and talks to the existing member before making a decision.`,
      },
      {
        id: "osc-taken",
        heading: "What if your category is already taken?",
        body: `If the seat for your profession is filled, you still have options:

- **Check for a specialism.** As above, a narrower or different focus may be a separate category.
- **Join the waiting list.** Seats do become available, and the chapter will remember who asked.
- **Consider another chapter.** There are other BNI chapters across Cheshire and beyond, and the regional team can point you to one with your seat open.
- **Visit anyway.** Guests are welcome whatever their profession, and members are often happy to help with introductions regardless.

You can also simply ask on the morning. Members will tell you honestly whether there is likely to be an overlap.`,
      },
      {
        id: "osc-check",
        heading: "Check before you visit",
        body: `Because seats are filled on a first-come basis, it is worth checking availability early. The [open seats page](/open-seats) lists the categories the chapter is actively looking to fill, and the [trades directory](/trades) shows which professions are already represented.

If your category is open, a guest visit is the natural next step. Come along on a {{meetingDay}} morning, meet the members and see whether the chapter is right for you before someone else claims the seat.`,
      },
    ],
    faqs: [
      {
        question: "Can two people from the same profession join one BNI chapter?",
        answer:
          "Not usually. Each chapter has one seat per professional category. Where specialisms are clearly different, such as family law and employment law, they can be treated as separate seats.",
      },
      {
        question: "What happens if my category is taken?",
        answer:
          "You can ask about a specialist category, join the waiting list, or visit another BNI chapter where the seat is open. Guests are welcome to visit whatever their profession.",
      },
      {
        question: "How do I check which seats are available?",
        answer:
          "See the open seats page for categories the chapter is looking to fill, and the trades directory for professions already represented.",
      },
    ],
    ctaHeading: "Is your seat open?",
    ctaBody:
      "Check the [open seats](/open-seats), browse the [directory](/directory), then come and meet the chapter on a {{meetingDay}} morning.",
    published: true,
    publishedAt: new Date("2026-09-22T09:00:00.000Z"),
    excerpt:
      "One member per profession stops competition in the room, gives referrers total clarity and raises the bar for everyone.",
    sortOrder: 330,
  },
  {
    slug: "member-spotlight-referral-win",
    kind: "article",
    locationName: null,
    title: "How weekly attendance turns into closed business",
    metaTitle: "Turning BNI attendance into closed business | BNI Dabbers",
    metaDescription:
      "How BNI members turn weekly meetings into closed business: teaching the room, using 1-2-1s, following up properly and staying consistent.",
    heroEyebrow: "Making BNI work",
    heroImageUrl: null,
    intro:
      "Some members receive a steady stream of referrals and others wonder why the phone is quiet, even though they attend the same meetings. The difference is rarely luck. It usually comes down to **education, follow-up and consistency**.",
    sections: [
      {
        id: "ms-slow",
        heading: "Why the first months can feel slow",
        body: `New members often expect referrals to start in the first few weeks. Sometimes they do, but more often there is a period where it feels like you are giving more than you are getting.

That is normal. Before anyone refers you to a valued client or friend, they need to understand what you do and trust that you will look after the people they send you. That takes a little time.

Members who push through this stage, and use it well, tend to find referrals build steadily after it. Members who expect instant results and disengage rarely see the benefit. Here is what the successful ones do differently.`,
      },
      {
        id: "ms-teach",
        heading: "Teach the room, every week",
        body: `Every week, each member gets a short slot to talk about their business. It is tempting to say roughly the same thing each time. The members who get the most referrals use the slot to **teach**, not just remind.

That means:

- **Focusing on one thing per week.** One service, one type of client, one problem you solve.
- **Being specific about the referral you want.** "Anyone who needs an accountant" is too broad to act on. "Business owners who have just gone VAT-registered and are doing their own books" is something members can listen out for.
- **Giving trigger phrases.** Tell members what a prospect might say that signals they need you, such as "we have just taken on our first employee" or "our lease is up next year".
- **Sharing short stories.** A brief example of a problem you solved is far more memorable than a list of services.

Over a few months, this builds a detailed picture of your business in everyone's head, so they spot opportunities you would never have heard about.`,
      },
      {
        id: "ms-121",
        heading: "Use 1-2-1s properly",
        body: `A 1-2-1 is a meeting between two members outside the weekly meeting, usually over a coffee or a video call. It is where the real understanding happens.

A good 1-2-1 is a two-way conversation. Spend half the time learning about the other member's business: who their ideal client is, what a great referral looks like for them, and who they would love to be introduced to. Spend the other half helping them understand yours.

Come prepared. Think about who in your own network might be useful to them before you sit down. And aim to work through the whole chapter over time, not just the members you already get on with. Some of the strongest referral partnerships come from businesses you would not have expected.`,
      },
      {
        id: "ms-follow",
        heading: "Follow up, then report",
        body: `When a referral arrives, how you handle it determines whether more follow. Contact the prospect quickly, keep the referrer informed and deliver what you promised. Our guide to [referral follow-up habits](/insights/referral-follow-up-tips) covers this in detail.

When the work closes, record it as **TYFCB, Thank You For Closed Business**. It does two things. It shows the referrer their trust was well placed, which makes them more likely to refer again. And it shows the whole room what a successful referral looks like for you.

Across {{chapterName}}, members recorded **{{tyfcbHeadline}}** of closed business over the last 12 months. Every one of those figures started with someone listening carefully in a weekly meeting.`,
      },
      {
        id: "ms-consistency",
        heading: "Consistency compounds",
        body: `Attendance matters more than people expect. Each week you miss is a week your business is not front of mind, and a week you are not learning about the referrals other members need.

When you genuinely cannot make it, send a **substitute**: a colleague or trusted contact who can attend on your behalf and give your weekly presentation. It keeps your seat represented and it is good exposure for them too.

The members who see the best results are rarely the loudest in the room. They are the ones who turn up every week, give clear and specific asks, follow up reliably and look for ways to help others. Over months and years, that consistency builds a reputation that keeps referrals coming.`,
      },
      {
        id: "ms-plan",
        heading: "A simple 90-day plan for new members",
        body: `If you are just starting out, this is a straightforward way to build momentum:

1. **Weeks 1 to 4:** book a 1-2-1 with a different member each week. Focus on learning about their businesses.
2. **Weeks 5 to 8:** plan your weekly slots around one specific referral at a time, with trigger phrases and a short example.
3. **Weeks 9 to 12:** keep going with 1-2-1s, start giving referrals to the members you have got to know, and record any closed business promptly.

By the end of three months, most of the room should understand exactly what you do and who you are looking for. That is the foundation everything else is built on.

Curious whether BNI could work for your business? [Read our honest take on whether BNI is worth it](/is-bni-worth-it), or come and see a meeting for yourself.`,
      },
    ],
    faqs: [
      {
        question: "How long before I get referrals in BNI?",
        answer:
          "It varies, but most members find the first few months are about building understanding and trust. Members who teach the room clearly and do regular 1-2-1s usually see referrals build steadily after that.",
      },
      {
        question: "What is a 1-2-1 in BNI?",
        answer:
          "A 1-2-1 is a meeting between two members outside the weekly meeting to learn about each other's businesses in depth, so each can refer the other more effectively.",
      },
      {
        question: "What if I cannot attend a weekly meeting?",
        answer:
          "Members can send a substitute, such as a colleague or trusted contact, to attend on their behalf and give their weekly presentation.",
      },
    ],
    ctaHeading: "Ask members how they make it work",
    ctaBody:
      "Visit a {{meetingDay}} morning meeting and ask members how they turn weekly attendance into closed business.",
    published: true,
    publishedAt: new Date("2026-09-29T09:00:00.000Z"),
    excerpt:
      "Why some members get a steady stream of referrals and others do not: teaching the room, using 1-2-1s, following up and staying consistent.",
    sortOrder: 340,
  },
  {
    slug: "networking-vs-sales-pitch",
    kind: "article",
    locationName: null,
    title: "Networking conversation vs sales pitch",
    metaTitle: "Networking vs sales pitch | BNI Dabbers",
    metaDescription:
      "Why referral-focused networking rewards curiosity over pitching, and how to introduce yourself so people remember you and refer you.",
    heroEyebrow: "Communication",
    heroImageUrl: null,
    intro:
      "The quickest way to lose a room is to **pitch**. In a referral group, the people you meet are rarely your customers. They are the route to your customers, and that changes how you should talk to them.",
    sections: [
      {
        id: "nvs-why",
        heading: "Why pitching falls flat",
        body: `Most of us have been on the receiving end. You introduce yourself at an event and within a minute the other person is explaining their packages, prices and latest offer. You nod politely and look for a way out.

Pitching fails at networking for a simple reason: the person in front of you probably does not need what you sell, at least not right now. Even if they might one day, being sold to in a social setting feels uncomfortable.

In a BNI meeting, that is even more true. Members are not there to buy from each other. They are there to understand each other well enough to refer business. A pitch gives them information they cannot use. A good conversation gives them something they can.`,
      },
      {
        id: "nvs-network",
        heading: "You are talking to a network, not a person",
        body: `It helps to change how you picture the person you are talking to. They are not a single prospect. They are a doorway into everyone they know: clients, suppliers, friends, family and other professionals.

A commercial insurance broker speaks to business owners every day. A heating engineer is in people's homes all week. An accountant knows exactly which of their clients are growing, struggling or thinking of selling.

If you help someone like that understand who you work with and when they need you, they can spot opportunities for you that you would never find on your own. That is worth far more than selling to them directly.`,
      },
      {
        id: "nvs-questions",
        heading: "Lead with questions",
        body: `The best networkers are curious. They ask questions, listen properly and remember the answers. Some that work well:

- "What does a good client look like for you?"
- "What kind of work do you most enjoy doing?"
- "How do most of your clients find you at the moment?"
- "Who would be a great introduction for you this month?"

Asking first does two things. It shows genuine interest, which makes people far more open when it is your turn. And it gives you useful information. If you can make an introduction for someone, even a small one, you have started a relationship on the best possible footing.

When people ask about you in return, which they almost always will, keep your answer short and clear.`,
      },
      {
        id: "nvs-repeatable",
        heading: "Introduce yourself in a way people can repeat",
        body: `The real test of a networking introduction is not whether it impressed the listener. It is whether they could explain what you do to someone else.

So keep it simple:

- **Say who you help, not just what you are.** "I'm a web designer" is forgettable. "I build websites for trades businesses who want more enquiries from their local area" is something people can repeat.
- **Use plain language.** Leave out the jargon, acronyms and industry terms.
- **Give an example.** One short story about a problem you solved is worth a list of services.
- **Mention the trigger.** Tell people what to listen for. "If anyone mentions their website is out of date or not bringing in work, that is where I come in."

If someone could pass that on accurately in a sentence, you have done your job.`,
      },
      {
        id: "nvs-121",
        heading: "Save the detail for a 1-2-1",
        body: `There is a time for the deeper conversation about how you work, what you charge and what makes you different. It is just not the open networking at the start of a meeting.

In BNI, that detail belongs in a **1-2-1**: a dedicated meeting between two members, usually over coffee, where you each take time to understand the other's business properly. That is where it is appropriate to talk through your services, share examples and explain the kind of referral that suits you best.

If a conversation during networking is going well, the best next step is usually "shall we grab a coffee and get into this properly?" rather than launching into it there and then.`,
      },
      {
        id: "nvs-mistakes",
        heading: "Common mistakes to avoid",
        body: `A few habits that put people off, often without the speaker realising:

- **Leading with price or offers.** It signals you see the other person as a sale, not a relationship.
- **Talking for too long.** If you have been speaking for more than a minute without a question, pause.
- **Looking over someone's shoulder** for a more useful contact. People notice.
- **Handing out cards before a conversation.** A card means more once someone actually wants to stay in touch.
- **Being vague about the referral you want.** "Anyone who needs my services" gives people nothing to listen for.`,
      },
      {
        id: "nvs-first-visit",
        heading: "On your first visit",
        body: `If you are coming along as a guest, you do not need to worry about any of this too much. Members will ask you about your business, and you will be invited to give a short introduction during the meeting. Our [guest visit checklist](/insights/guest-visit-checklist) covers how to prepare.

The best approach is simply to be curious. Ask members about their businesses, listen to the weekly presentations and notice who you might be able to help. Guests who do that tend to leave with more useful connections than those who arrive ready to sell.

You will see the difference between networking and pitching for yourself within the first ten minutes.`,
      },
    ],
    faqs: [
      {
        question: "Should I pitch my business at a BNI meeting?",
        answer:
          "No. Focus on helping members understand who you help and what a good referral looks like. Detailed conversations about your services belong in a 1-2-1 meeting.",
      },
      {
        question: "How long should my introduction be?",
        answer:
          "For guests, around thirty seconds is plenty. Say who you are, who you help, the problem you solve and where you work.",
      },
      {
        question: "What is the best question to ask at a networking event?",
        answer:
          "Something like 'What does a good client look like for you?' It shows interest and gives you the information you need to help them.",
      },
    ],
    ctaHeading: "Experience the culture",
    ctaBody:
      "Visit on a {{meetingDay}} morning and see how a referral-first room works in practice.",
    published: true,
    publishedAt: new Date("2026-10-01T09:00:00.000Z"),
    excerpt:
      "In a referral group, the people you meet are the route to your customers. Why curiosity beats pitching, and how to introduce yourself.",
    sortOrder: 350,
  },
];
