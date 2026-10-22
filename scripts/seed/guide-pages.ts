import type { NewPage } from "../../src/db/schema";

type SeedPage = Omit<NewPage, "id" | "createdAt" | "updatedAt">;

export const GUIDE_PAGES: SeedPage[] = [
  {
    slug: "what-is-bni",
    kind: "standard",
    locationName: null,
    title: "What is BNI?",
    metaTitle: "What is BNI? | Business networking explained",
    metaDescription:
      "What is BNI and how does referral networking work? Learn how BNI Dabbers in Cheshire East helps members grow through structured weekly meetings.",
    heroEyebrow: "BNI explained",
    heroImageUrl: null,
    intro:
      "**BNI (Business Network International)** is the world's largest referral networking organisation. Chapters meet weekly so members learn each other's businesses and pass **qualified referrals** — not just collect contacts.",
    sections: [
      {
        id: "what-core",
        heading: "Referrals, not just networking",
        body:
          "Traditional networking often stops at introductions. BNI adds accountability: members track **Thank You For Closed Business (TYFCB)** and referrals, so the room optimises for results over attendance numbers.",
      },
      {
        id: "what-format",
        heading: "Weekly meeting format",
        body:
          "{{meetingFacts}}\n\nAgenda items include open networking, member stories, education and referral passing. Guests can attend to evaluate the culture before applying.",
      },
      {
        id: "what-dabbers",
        heading: "BNI Dabbers in Cheshire East",
        body:
          "Our chapter meets at {{venueName}} and serves owners from Nantwich, Crewe, Sandbach and surrounding towns. One member per trade category keeps referrals unambiguous.",
      },
    ],
    faqs: [
      {
        question: "Is BNI the same as a chamber of commerce?",
        answer:
          "No. Chambers offer broad business support; BNI focuses on weekly referral generation within a closed member group. See our comparison page for detail.",
      },
      {
        question: "Can anyone join BNI?",
        answer:
          "You apply for an open seat in your trade category. If the seat is taken, you may join a waiting list or choose another chapter.",
      },
      {
        question: "How do I visit BNI Dabbers?",
        answer: "Use the visit form to request a guest place at the next {{meetingDay}} meeting.",
      },
    ],
    ctaHeading: "See BNI in person",
    ctaBody: "Request a guest visit to {{chapterName}} and decide if referral networking fits your business.",
    published: true,
    publishedAt: null,
    excerpt: null,
    sortOrder: 200,
  },
  {
    slug: "bni-vs-chamber-of-commerce",
    kind: "standard",
    locationName: null,
    title: "BNI vs Chamber of Commerce",
    metaTitle: "BNI vs Chamber of Commerce | Which is right for you?",
    metaDescription:
      "Compare BNI referral networking with chamber of commerce membership for Cheshire East business owners.",
    heroEyebrow: "Compare options",
    heroImageUrl: null,
    intro:
      "Both **BNI** and **Chambers of Commerce** support local business — but they solve different problems. This guide helps you choose (or combine) them wisely.",
    sections: [
      {
        id: "cmp-bni",
        heading: "What BNI optimises for",
        body:
          "Weekly attendance, tracked referrals and one seat per profession. Best when you want a dedicated sales channel through trusted introductions.",
      },
      {
        id: "cmp-chamber",
        heading: "What chambers optimise for",
        body:
          "Policy voice, broad events, training and local visibility. Best when you want community representation and varied touchpoints without weekly commitment.",
      },
      {
        id: "cmp-both",
        heading: "Using both",
        body:
          "Many owners maintain chamber membership for profile while using BNI for predictable referral activity. The test is whether you will invest weekly time in BNI's format.",
      },
    ],
    faqs: [
      {
        question: "Is BNI more expensive than a chamber?",
        answer:
          "Costs differ by chapter and chamber tier. Compare fees against expected referral value and time commitment.",
      },
      {
        question: "Which is better for new businesses?",
        answer:
          "BNI can accelerate introductions if you attend consistently. Chambers can widen general visibility. Visiting BNI as a guest is the fastest way to judge fit.",
      },
      {
        question: "Does BNI Dabbers replace local chamber ties?",
        answer:
          "No — members still serve the wider business community. BNI complements other networks when you honour weekly referral discipline.",
      },
    ],
    ctaHeading: "Try BNI before you decide",
    ctaBody: "Guest visit {{chapterName}} on a {{meetingDay}} morning — no obligation to join.",
    published: true,
    publishedAt: null,
    excerpt: null,
    sortOrder: 210,
  },
  {
    slug: "breakfast-networking-cheshire",
    kind: "standard",
    locationName: null,
    title: "Breakfast networking in Cheshire",
    metaTitle: "Breakfast networking Cheshire | BNI Dabbers",
    metaDescription:
      "Early-morning business networking in Cheshire East — BNI Dabbers meets {{meetingDay}}s at {{venueName}}.",
    heroEyebrow: "Morning meetings",
    heroImageUrl: null,
    intro:
      "**Breakfast networking in Cheshire** suits owners who want client work to start with momentum. BNI Dabbers meets early at {{venueName}} so you are back to work by mid-morning.",
    sections: [
      {
        id: "brk-time",
        heading: "Why breakfast meetings work",
        body:
          "{{meetingFacts}}\n\nMorning slots reduce clashes with client appointments and keep the room focused.",
      },
      {
        id: "brk-who",
        heading: "Who attends",
        body:
          "Owners and senior decision-makers who treat networking as a weekly discipline — not an occasional social event.",
      },
    ],
    faqs: [
      {
        question: "Do I need to stay for the whole meeting?",
        answer:
          "Guests should plan for the full {{meetingTimeRangeEnDash}} slot to experience the format properly.",
      },
      {
        question: "Is food served?",
        answer: "Check guest confirmation details when your visit is booked.",
      },
      {
        question: "Can I visit without joining?",
        answer: "Yes — guest visits are designed for exactly that.",
      },
    ],
    ctaHeading: "Book a breakfast guest visit",
    ctaBody: "Request a place at the next {{meetingDay}} morning meeting.",
    published: true,
    publishedAt: null,
    excerpt: null,
    sortOrder: 220,
  },
  {
    slug: "business-networking-near-me",
    kind: "standard",
    locationName: null,
    title: "Business networking near me",
    metaTitle: "Business networking near me | Cheshire East BNI",
    metaDescription:
      "Find business networking near you in Cheshire East — BNI Dabbers at {{venueName}}, guest visits welcome.",
    heroEyebrow: "Local networking",
    heroImageUrl: null,
    intro:
      "Searching **business networking near me** in Cheshire East? Start with a chapter that publishes members, meeting times and a clear guest visit path.",
    sections: [
      {
        id: "near-venue",
        heading: "Where we meet",
        body: "{{venueLine}}.\n\nBrowse [networking groups by town](/networking-groups) or the [member directory](/directory).",
      },
      {
        id: "near-fit",
        heading: "Is BNI the right fit?",
        body:
          "If you want weekly accountability and tracked referrals, BNI fits. If you want occasional events only, consider chambers or social clubs alongside a guest visit here.",
      },
    ],
    faqs: [
      {
        question: "How far do members travel?",
        answer:
          "Guests regularly travel 20–35 minutes from towns across Cheshire East and nearby Staffordshire.",
      },
      {
        question: "How do I find open categories?",
        answer: "See [open seats](/open-seats) or ask on a guest visit.",
      },
      {
        question: "What should I bring?",
        answer: "Business cards, a clear description of your ideal referral and questions for members.",
      },
    ],
    ctaHeading: "Visit your nearest BNI chapter meeting",
    ctaBody: "BNI Dabbers welcomes guests from across Cheshire East every {{meetingDay}}.",
    published: true,
    publishedAt: null,
    excerpt: null,
    sortOrder: 230,
  },
  {
    slug: "how-bni-referrals-work",
    kind: "standard",
    locationName: null,
    title: "How BNI referrals work",
    metaTitle: "How BNI referrals work | BNI Dabbers guide",
    metaDescription:
      "Understand BNI referral slips, TYFCB tracking and how BNI Dabbers members pass business to each other.",
    heroEyebrow: "Referral system",
    heroImageUrl: null,
    intro:
      "BNI referrals are **intentional introductions** between members — logged, tracked and discussed weekly so quality stays high.",
    sections: [
      {
        id: "ref-types",
        heading: "Types of referrals",
        body:
          "Members pass inside referrals (between members), outside referrals (to non-members) and TYFCB when closed business is reported.",
      },
      {
        id: "ref-quality",
        heading: "Quality over quantity",
        body:
          "A strong referral includes context, permission and urgency. The weekly meeting creates accountability to follow up.",
      },
      {
        id: "ref-dabbers",
        heading: "Referrals at BNI Dabbers",
        body:
          "Our chapter tracks results over rolling 12 months — members passed {{tyfcbHeadline}} in closed business (verified from BNI Connect, {{tyfcbVerified}}).",
      },
    ],
    faqs: [
      {
        question: "Do I have to pass referrals every week?",
        answer:
          "Expectation is active participation. Members who consistently engage receive stronger support from the room.",
      },
      {
        question: "What is TYFCB?",
        answer:
          "Thank You For Closed Business — the value of business members report closing from BNI referrals.",
      },
      {
        question: "Can visitors receive referrals?",
        answer:
          "Referrals flow between members. Visiting helps you decide whether membership is worth the investment.",
      },
    ],
    ctaHeading: "See referrals in action",
    ctaBody: "Guest visit a {{meetingDay}} meeting and hear member success stories.",
    published: true,
    publishedAt: null,
    excerpt: null,
    sortOrder: 240,
  },
  {
    slug: "what-to-expect-as-a-visitor",
    kind: "standard",
    locationName: null,
    title: "What to expect as a BNI visitor",
    metaTitle: "What to expect as a BNI visitor | BNI Dabbers",
    metaDescription:
      "First-time BNI guest visit guide — timing, dress, agenda and how to prepare for BNI Dabbers in Cheshire East.",
    heroEyebrow: "Guest guide",
    heroImageUrl: null,
    intro:
      "Your first **BNI visitor** experience should feel welcoming and structured. Here is what happens at BNI Dabbers.",
    sections: [
      {
        id: "vis-arrive",
        heading: "Arrival and timing",
        body:
          "{{meetingFacts}}\n\nArrive from {{meetingStart}}. The visitor host team will greet you and explain the agenda.",
      },
      {
        id: "vis-agenda",
        heading: "Meeting agenda",
        body:
          "Expect open networking, formal start, member introductions, education, referrals and closing announcements.",
      },
      {
        id: "vis-after",
        heading: "After the meeting",
        body:
          "Stay for conversation if you can. You will receive follow-up about membership options if you are interested — no hard sell on the day.",
      },
    ],
    faqs: [
      {
        question: "What should I wear?",
        answer: "Business casual to smart business dress — most members dress professionally.",
      },
      {
        question: "Can I bring a colleague?",
        answer: "Check when booking — guest policies may limit seats per company.",
      },
      {
        question: "Is there a visitor fee?",
        answer: "Confirmed when your visit is booked via the visit form.",
      },
    ],
    ctaHeading: "Book your first visit",
    ctaBody: "Request a guest place at the next {{meetingDay}} meeting.",
    published: true,
    publishedAt: null,
    excerpt: null,
    sortOrder: 250,
  },
  {
    slug: "guest-day",
    kind: "standard",
    locationName: null,
    title: "Guest day at BNI Dabbers",
    metaTitle: "BNI guest day | Visit BNI Dabbers Cheshire East",
    metaDescription:
      "Plan your BNI guest day at BNI Dabbers — venue, schedule and how to request a visit.",
    heroEyebrow: "Guest day",
    heroImageUrl: null,
    intro:
      "Treat your **BNI guest day** like a working meeting: prepare your pitch, bring cards and plan travel to {{venueName}}.",
    sections: [
      {
        id: "gd-plan",
        heading: "Plan your morning",
        body:
          "Allow travel time, parking and 15 minutes of open networking before the formal start at {{meetingStart}}.",
      },
      {
        id: "gd-pitch",
        heading: "Prepare your introduction",
        body:
          "Be ready to explain who you help, your ideal referral and what makes you credible — in under a minute.",
      },
    ],
    faqs: [
      {
        question: "How long is a guest day?",
        answer: "Plan for {{meetingTimeRangeEnDash}} plus travel.",
      },
      {
        question: "Will I meet the whole chapter?",
        answer: "Yes — guest visits include the full member room.",
      },
      {
        question: "What happens next?",
        answer:
          "If you are interested in membership, the team explains open categories and application steps.",
      },
    ],
    ctaHeading: "Schedule your guest day",
    ctaBody: "Submit the visit form to confirm your {{meetingDay}} guest place.",
    published: true,
    publishedAt: null,
    excerpt: null,
    sortOrder: 260,
  },
  {
    slug: "bni-visitor-faq",
    kind: "standard",
    locationName: null,
    title: "BNI visitor FAQ",
    metaTitle: "BNI visitor FAQ | BNI Dabbers guest visits",
    metaDescription:
      "Frequently asked questions about visiting BNI Dabbers as a guest in Cheshire East.",
    heroEyebrow: "Visitor FAQ",
    heroImageUrl: null,
    intro: "Quick answers for **BNI visitors** planning a trip to BNI Dabbers.",
    sections: [
      {
        id: "vfaq-where",
        heading: "Location",
        body: "{{venueLine}}.",
      },
      {
        id: "vfaq-open",
        heading: "Open categories",
        body: "See [open seats](/open-seats) or ask the visitor host on the day.",
      },
    ],
    faqs: [
      {
        question: "How do I book a visitor slot?",
        answer: "Use the [visit form](/visit) on this site.",
      },
      {
        question: "Can I visit twice?",
        answer:
          "BNI typically allows limited repeat guest visits — ask the chapter if you need a second look.",
      },
      {
        question: "Are online meetings available?",
        answer:
          "BNI Dabbers meets in person at {{venueName}} for the full chapter experience.",
      },
      {
        question: "What is the dress code?",
        answer: "Smart business dress is common; business casual is acceptable.",
      },
      {
        question: "Do visitors participate in referrals?",
        answer: "Guests observe — referrals are member activities.",
      },
      {
        question: "How soon can I join after visiting?",
        answer:
          "If your category is open, application can move quickly after a successful guest visit.",
      },
    ],
    ctaHeading: "Still have questions?",
    ctaBody: "Book a visit and ask members in person on {{meetingDay}}.",
    published: true,
    publishedAt: null,
    excerpt: null,
    sortOrder: 270,
  },
  {
    slug: "is-bni-worth-it",
    kind: "standard",
    locationName: null,
    title: "Is BNI worth it?",
    metaTitle: "Is BNI worth it? | Honest guide for business owners",
    metaDescription:
      "Is BNI worth the membership cost and weekly commitment? Results, TYFCB and how to evaluate BNI Dabbers as a guest.",
    heroEyebrow: "Worth it?",
    heroImageUrl: null,
    intro:
      "**Is BNI worth it?** Depends on whether you will attend weekly, follow up on referrals and hold a differentiated seat in your market.",
    sections: [
      {
        id: "worth-results",
        heading: "What results look like",
        body:
          "BNI publishes average growth statistics globally; locally, our chapter reported {{tyfcbHeadline}} in closed business over 12 months ({{tyfcbVerified}}). Individual results vary with effort and category demand.",
      },
      {
        id: "worth-cost",
        heading: "Cost vs opportunity",
        body:
          "Membership is an investment. Compare fees to lifetime value of one good client from a member referral.",
      },
      {
        id: "worth-test",
        heading: "Test before you join",
        body:
          "Guest visit, speak to members in your trade adjacency and review the directory before applying.",
      },
    ],
    faqs: [
      {
        question: "Who should not join BNI?",
        answer:
          "If you cannot commit weekly or dislike structured agendas, BNI will frustrate you.",
      },
      {
        question: "How fast will I see referrals?",
        answer:
          "Many members see traction within months if they educate the room and follow up consistently.",
      },
      {
        question: "What if my seat is closed?",
        answer: "You may wait, choose another chapter or explore [open seats](/open-seats).",
      },
    ],
    ctaHeading: "Decide with evidence",
    ctaBody: "Visit BNI Dabbers on a {{meetingDay}} and judge the room yourself.",
    published: true,
    publishedAt: null,
    excerpt: null,
    sortOrder: 280,
  },
];
