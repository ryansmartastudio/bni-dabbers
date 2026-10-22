import type { NewPage, PageFaq, PageSection } from "../../src/db/schema";

type SeedPage = Omit<NewPage, "id" | "createdAt" | "updatedAt">;

export type RichLocationConfig = {
  slug: string;
  town: string;
  sortOrder: number;
  metaTitle: string;
  metaDescription: string;
  heroEyebrow: string;
  intro: string;
  driveNote: string;
  landmarks: string;
  businessLandscape: string;
  nearbyTowns: string;
  ctaHeading: string;
  ctaBody: string;
  sectionHeadings?: Partial<{
    expect: string;
    who: string;
    format: string;
    visit: string;
    why: string;
  }>;
};

function richLocationSections(config: RichLocationConfig): PageSection[] {
  const h = config.sectionHeadings ?? {};
  return [
    {
      id: `${config.slug}-expect`,
      heading: h.expect ?? `Business networking near ${config.town}`,
      body: `BNI Dabbers welcomes owners and professionals from **${config.town}** who want more than a one-off coffee morning. ${config.landmarks}\n\n{{meetingFacts}}\n\n${config.driveNote}`,
    },
    {
      id: `${config.slug}-landscape`,
      heading: h.who ?? `Local business landscape around ${config.town}`,
      body: config.businessLandscape,
    },
    {
      id: `${config.slug}-format`,
      heading: h.format ?? "Inside a typical {{meetingDay}} meeting",
      body:
        "Meetings follow the BNI agenda: open networking, structured introductions, education and referral passing. You will hear who each member wants to meet and how they deliver for clients.\n\nGuests arrive from {{meetingStart}}. Introduce yourself to the visitor team and stay for conversation when you can.",
    },
    {
      id: `${config.slug}-visit`,
      heading: h.visit ?? `Guest visits from ${config.town}`,
      body: `Many members and guests travel from ${config.town} each week. Nearby towns include ${config.nearbyTowns}.\n\nUse the visit form to request a place at the next {{meetingDay}} meeting — we will confirm guest details by email.`,
    },
    {
      id: `${config.slug}-why`,
      heading: h.why ?? "Why owners stay in this chapter",
      body:
        "BNI Dabbers combines referral accountability with a supportive room. One seat per trade keeps introductions clear, and weekly attendance builds the trust that makes referrals meaningful.",
    },
  ];
}

function locationFaqs(town: string): PageFaq[] {
  return [
    {
      question: `Is there a BNI networking group in ${town}?`,
      answer: `BNI Dabbers meets at {{venueName}} and regularly hosts guests from ${town} and surrounding Cheshire East towns.`,
    },
    {
      question: "Can I visit before joining?",
      answer:
        "Yes. Submit the visit form and a chapter representative will confirm the next suitable {{meetingDay}} morning.",
    },
    {
      question: "What time is the meeting?",
      answer:
        "{{meetingDay}} mornings, {{meetingTimeRangeEnDash}}. Arrive from {{meetingStart}} for open networking.",
    },
    {
      question: "Where do you meet?",
      answer: "{{venueLine}}.",
    },
    {
      question: "Is there a fee to visit as a guest?",
      answer:
        "Guest arrangements and any visitor fees are confirmed when your visit is booked.",
    },
    {
      question: "What types of businesses are in the chapter?",
      answer:
        "Browse the member directory for active seats. BNI allows one member per trade category.",
    },
  ];
}

export function buildLocationPage(config: RichLocationConfig): SeedPage {
  return {
    slug: config.slug,
    kind: "location",
    locationName: config.town,
    title: `Networking groups in ${config.town}`,
    metaTitle: config.metaTitle,
    metaDescription: config.metaDescription,
    heroEyebrow: config.heroEyebrow,
    heroImageUrl: null,
    intro: config.intro,
    sections: richLocationSections(config),
    faqs: locationFaqs(config.town),
    ctaHeading: config.ctaHeading,
    ctaBody: config.ctaBody,
    published: true,
    publishedAt: null,
    excerpt: null,
    sortOrder: config.sortOrder,
  };
}

export const LOCATION_PAGES: SeedPage[] = [
  buildLocationPage({
    slug: "nantwich",
    town: "Nantwich",
    sortOrder: 10,
    metaTitle: "Networking groups Nantwich | BNI Dabbers Cheshire East",
    metaDescription:
      "Networking groups in Nantwich: BNI Dabbers meets weekly at {{venueName}} — referral-first business networking for Cheshire East.",
    heroEyebrow: "Nantwich · Cheshire East",
    intro:
      "Searching for **networking groups in Nantwich**? BNI Dabbers meets at {{venueName}} with a referral-first culture and members from across south Cheshire.",
    driveNote:
      "From Nantwich town centre, allow around 15–20 minutes to {{venueName}} via the A51 toward Crewe — many guests use the A500 link.",
    landmarks: "Nantwich's independent retail and professional services community makes strong referral partners for trades across the chapter.",
    businessLandscape:
      "The town mixes long-established family businesses with professional services, hospitality and construction firms — the same mix reflected in our member seats.",
    nearbyTowns: "Crewe, Audlem, Wybunbury and Sandbach",
    ctaHeading: "Visit from Nantwich",
    ctaBody: "Request a guest visit and meet members who already serve Nantwich clients.",
    sectionHeadings: {
      expect: "Structured networking for Nantwich business owners",
    },
  }),
  buildLocationPage({
    slug: "cheshire-east",
    town: "Cheshire East",
    sortOrder: 20,
    metaTitle: "Networking groups Cheshire East | BNI Dabbers",
    metaDescription:
      "Networking groups in Cheshire East: weekly {{meetingDay}} meetings at {{venueName}} with tracked referrals and guest visits.",
    heroEyebrow: "Cheshire East · BNI Dabbers",
    intro:
      "For **networking groups in Cheshire East**, BNI Dabbers is a central {{meetingDay}} chapter built on referrals, education and long-term relationships.",
    driveNote:
      "The venue near Crewe sits on major Cheshire East road links, so members from multiple towns can attend consistently.",
    landmarks: "Cheshire East spans market towns, logistics hubs and rural professional services — our member mix reflects that diversity.",
    businessLandscape:
      "Manufacturing supply chains, professional services and hospitality businesses all refer within the chapter, which keeps introductions relevant across the borough.",
    nearbyTowns: "Crewe, Macclesfield, Congleton and Sandbach",
    ctaHeading: "Explore Cheshire East networking",
    ctaBody: "Book a guest visit to experience referral-first networking with BNI Dabbers.",
  }),
  buildLocationPage({
    slug: "crewe",
    town: "Crewe",
    sortOrder: 30,
    metaTitle: "Networking groups Crewe | BNI Dabbers",
    metaDescription:
      "Business networking groups in Crewe: BNI Dabbers at {{venueName}} every {{meetingDay}} — guests welcome.",
    heroEyebrow: "Crewe · Cheshire East",
    intro:
      "Looking for **networking groups in Crewe**? BNI Dabbers meets at {{venueName}} every {{meetingDay}} for referral-focused networking minutes from town.",
    driveNote: "Crewe-based guests often reach {{venueName}} in under 15 minutes via local routes toward Weston.",
    landmarks: "Crewe's rail and logistics heritage means many members serve B2B clients as well as local consumers.",
    businessLandscape:
      "Engineering, transport, retail and professional services firms in Crewe use the chapter to reach decision-makers across Cheshire East without city-centre travel.",
    nearbyTowns: "Nantwich, Sandbach, Alsager and Haslington",
    ctaHeading: "Visit from Crewe",
    ctaBody: "Request a guest place at the next {{meetingDay}} meeting.",
  }),
  buildLocationPage({
    slug: "sandbach",
    town: "Sandbach",
    sortOrder: 40,
    metaTitle: "Networking groups Sandbach | BNI Dabbers",
    metaDescription:
      "Networking groups near Sandbach: BNI Dabbers weekly at {{venueName}} — structured referrals, guest visits welcome.",
    heroEyebrow: "Sandbach · Cheshire East",
    intro:
      "Want **networking groups near Sandbach** with weekly accountability? BNI Dabbers meets every {{meetingDay}} at {{venueName}}.",
    driveNote:
      "Sandbach owners typically drive to {{venueName}} in around 20 minutes via the A534/A5020 toward Crewe.",
    landmarks: "Sandbach's market town economy includes strong construction, retail and professional services sectors.",
    businessLandscape:
      "Members refer between trades that serve Sandbach households and businesses — from finance and property to home services.",
    nearbyTowns: "Holmes Chapel, Middlewich, Crewe and Congleton",
    ctaHeading: "Visit from Sandbach",
    ctaBody: "Tell us about your business and we will arrange a guest visit.",
  }),
  buildLocationPage({
    slug: "alsager",
    town: "Alsager",
    sortOrder: 50,
    metaTitle: "Networking groups Alsager | BNI Dabbers",
    metaDescription:
      "Business networking near Alsager — BNI Dabbers meets at {{venueName}} each {{meetingDay}} with guests from Cheshire East.",
    heroEyebrow: "Alsager · Cheshire East",
    intro:
      "**Networking groups near Alsager** often mean driving to a room that takes referrals seriously. BNI Dabbers meets weekly at {{venueName}}.",
    driveNote: "From Alsager, plan roughly 20–25 minutes to {{venueName}} via the A50 and A500.",
    landmarks: "Alsager sits between Stoke and Crewe, so members often serve clients across both Staffordshire and Cheshire.",
    businessLandscape:
      "Local professional services, health practices and trades use the chapter to grow without relying only on word-of-mouth in one town.",
    nearbyTowns: "Crewe, Kidsgrove, Sandbach and Haslington",
    ctaHeading: "Visit from Alsager",
    ctaBody: "Request a guest visit to meet members serving the Alsager area.",
  }),
  buildLocationPage({
    slug: "congleton",
    town: "Congleton",
    sortOrder: 60,
    metaTitle: "Networking groups Congleton | BNI Dabbers",
    metaDescription:
      "Networking in Congleton and Cheshire East — guest visits welcome at BNI Dabbers, {{venueName}}.",
    heroEyebrow: "Congleton · Cheshire East",
    intro:
      "Congleton business owners searching for **networking groups in Cheshire East** join BNI Dabbers for a structured {{meetingDay}} referral meeting.",
    driveNote: "Congleton to {{venueName}} is typically 25–30 minutes via the A34 and A500 toward Crewe.",
    landmarks: "Congleton's manufacturing and professional services base pairs well with the chapter's B2B member mix.",
    businessLandscape:
      "Owners who serve east Cheshire use the chapter to reach Crewe, Sandbach and Macclesfield clients through trusted introductions.",
    nearbyTowns: "Sandbach, Holmes Chapel, Macclesfield and Biddulph",
    ctaHeading: "Visit from Congleton",
    ctaBody: "Book a guest place and see the meeting format in person.",
  }),
  buildLocationPage({
    slug: "middlewich",
    town: "Middlewich",
    sortOrder: 70,
    metaTitle: "Networking groups Middlewich | BNI Dabbers",
    metaDescription:
      "Middlewich business networking — weekly BNI Dabbers meetings at {{venueName}}, Cheshire East.",
    heroEyebrow: "Middlewich · Cheshire East",
    intro:
      "For **networking groups near Middlewich**, BNI Dabbers offers a weekly referral room at {{venueName}} on {{meetingDay}} mornings.",
    driveNote: "Middlewich guests often reach the venue in about 20 minutes via the A533 and A5020.",
    landmarks: "Middlewich's industrial heritage and growing professional services sector fit the chapter's diverse seats.",
    businessLandscape:
      "Members refer logistics, engineering, property and home-service clients across mid-Cheshire.",
    nearbyTowns: "Northwich, Sandbach, Winsford and Holmes Chapel",
    ctaHeading: "Visit from Middlewich",
    ctaBody: "Submit the visit form for the next {{meetingDay}} meeting.",
  }),
  buildLocationPage({
    slug: "holmes-chapel",
    town: "Holmes Chapel",
    sortOrder: 80,
    metaTitle: "Networking groups Holmes Chapel | BNI Dabbers",
    metaDescription:
      "Holmes Chapel and Cheshire East networking — BNI Dabbers weekly at {{venueName}}.",
    heroEyebrow: "Holmes Chapel · Cheshire East",
    intro:
      "**Networking groups near Holmes Chapel** include BNI Dabbers — a referral-first chapter a short drive toward Crewe.",
    driveNote: "Allow around 15–20 minutes from Holmes Chapel via the A50 toward {{venueName}}.",
    landmarks: "Village and rural businesses around Holmes Chapel often need wider Cheshire reach — referrals help.",
    businessLandscape:
      "Construction, agriculture services, hospitality and professional firms in the area use BNI for introductions beyond their immediate postcode.",
    nearbyTowns: "Sandbach, Middlewich, Crewe and Goostrey",
    ctaHeading: "Visit from Holmes Chapel",
    ctaBody: "Request a guest visit to meet the chapter.",
  }),
  buildLocationPage({
    slug: "winsford",
    town: "Winsford",
    sortOrder: 90,
    metaTitle: "Networking groups Winsford | BNI Dabbers",
    metaDescription:
      "Winsford business owners: BNI Dabbers meets at {{venueName}} for referral networking across Cheshire East.",
    heroEyebrow: "Winsford · Cheshire East",
    intro:
      "Searching for **networking groups near Winsford**? BNI Dabbers meets centrally at {{venueName}} each {{meetingDay}}.",
    driveNote: "Winsford to the venue is typically 25 minutes via the A533/A530 toward Crewe.",
    landmarks: "Winsford's retail and industrial parks generate steady B2B demand — members serve many of those businesses.",
    businessLandscape:
      "The chapter connects Winsford owners with accountants, marketers, IT and trades across the region through tracked referrals.",
    nearbyTowns: "Middlewich, Northwich, Crewe and Sandbach",
    ctaHeading: "Visit from Winsford",
    ctaBody: "Arrange a guest visit for the next suitable meeting.",
  }),
  buildLocationPage({
    slug: "audlem",
    town: "Audlem",
    sortOrder: 100,
    metaTitle: "Networking groups Audlem | BNI Dabbers Cheshire",
    metaDescription:
      "Audlem and south Cheshire networking — guest visits at BNI Dabbers, {{venueName}}.",
    heroEyebrow: "Audlem · Cheshire",
    intro:
      "Audlem and surrounding villages need networking that respects travel time. BNI Dabbers meets weekly at {{venueName}} with guests from across south Cheshire.",
    driveNote: "From Audlem, expect roughly 25 minutes to {{venueName}} via the A525 and A500.",
    landmarks: "Tourism, rural professional services and trades around Audlem benefit from introductions across a wider catchment.",
    businessLandscape:
      "Members refer hospitality, property, construction and professional services clients throughout Cheshire East.",
    nearbyTowns: "Nantwich, Whitchurch, Market Drayton and Crewe",
    ctaHeading: "Visit from Audlem",
    ctaBody: "Request a guest place at our next {{meetingDay}} meeting.",
  }),
  buildLocationPage({
    slug: "haslington",
    town: "Haslington",
    sortOrder: 110,
    metaTitle: "Networking groups Haslington | BNI Dabbers",
    metaDescription:
      "Haslington and Crewe area networking — BNI Dabbers at {{venueName}} each {{meetingDay}}.",
    heroEyebrow: "Haslington · Cheshire East",
    intro:
      "**Networking groups near Haslington** include BNI Dabbers — minutes from Crewe at {{venueName}}.",
    driveNote: "Haslington guests often reach the venue in under 15 minutes.",
    landmarks: "Residential growth around Haslington brings local trades and services that refer across the chapter.",
    businessLandscape:
      "Home services, finance and professional members regularly serve Haslington and Crewe clients.",
    nearbyTowns: "Crewe, Alsager, Sandbach and Shavington",
    ctaHeading: "Visit from Haslington",
    ctaBody: "Book a guest visit online.",
  }),
  buildLocationPage({
    slug: "willaston",
    town: "Willaston",
    sortOrder: 120,
    metaTitle: "Networking groups Willaston | BNI Dabbers",
    metaDescription:
      "Willaston and Nantwich area business networking at BNI Dabbers — {{venueName}}.",
    heroEyebrow: "Willaston · Cheshire East",
    intro:
      "Willaston business owners looking for **networking groups near Nantwich** often visit BNI Dabbers at {{venueName}}.",
    driveNote: "Willaston to {{venueName}} is typically 15–20 minutes via Nantwich and the A51.",
    landmarks: "Willaston's proximity to Nantwich and Crewe makes a central chapter meeting practical each week.",
    businessLandscape:
      "Professional and trade businesses use referrals to reach clients across south Cheshire without multiple networking memberships.",
    nearbyTowns: "Nantwich, Crewe, Wybunbury and Wistaston",
    ctaHeading: "Visit from Willaston",
    ctaBody: "Request a guest visit to meet members.",
  }),
  buildLocationPage({
    slug: "wistaston",
    town: "Wistaston",
    sortOrder: 130,
    metaTitle: "Networking groups Wistaston | BNI Dabbers Crewe",
    metaDescription:
      "Wistaston and Crewe networking — weekly BNI Dabbers meetings, guest visits welcome.",
    heroEyebrow: "Wistaston · Crewe area",
    intro:
      "For **networking groups in the Crewe area**, including Wistaston, BNI Dabbers meets nearby at {{venueName}}.",
    driveNote: "Wistaston guests typically drive 10–15 minutes to {{venueName}}.",
    landmarks: "Crewe suburb businesses serve both local households and wider Cheshire East B2B clients.",
    businessLandscape:
      "The chapter's one-seat-per-category rule keeps referrals clear for Wistaston firms competing in crowded trades.",
    nearbyTowns: "Crewe, Willaston, Shavington and Nantwich",
    ctaHeading: "Visit from Wistaston",
    ctaBody: "Submit the visit form for guest confirmation.",
  }),
  buildLocationPage({
    slug: "market-drayton",
    town: "Market Drayton",
    sortOrder: 140,
    metaTitle: "Networking groups Market Drayton | BNI Dabbers",
    metaDescription:
      "Market Drayton and north Shropshire owners — guest visits at BNI Dabbers, Cheshire East.",
    heroEyebrow: "Market Drayton · cross-border",
    intro:
      "Market Drayton owners searching **business networking near Cheshire** travel to BNI Dabbers for a structured referral meeting at {{venueName}}.",
    driveNote: "Market Drayton to {{venueName}} is usually 30–35 minutes via the A53 and A500.",
    landmarks: "Agriculture, food supply and rural professional services around Market Drayton align with several chapter seats.",
    businessLandscape:
      "Cross-border referrals between Shropshire and Cheshire East happen naturally when members know each other's businesses weekly.",
    nearbyTowns: "Audlem, Nantwich, Whitchurch and Crewe",
    ctaHeading: "Visit from Market Drayton",
    ctaBody: "Request a guest visit — we welcome cross-border guests.",
  }),
  buildLocationPage({
    slug: "newcastle-under-lyme",
    town: "Newcastle-under-Lyme",
    sortOrder: 150,
    metaTitle: "Networking groups Newcastle-under-Lyme | BNI Dabbers",
    metaDescription:
      "Newcastle-under-Lyme business networking — guest visits at BNI Dabbers near Crewe.",
    heroEyebrow: "Newcastle-under-Lyme · Staffordshire",
    intro:
      "Staffordshire owners looking for **networking groups near Crewe** often guest at BNI Dabbers on {{meetingDay}} mornings.",
    driveNote: "Plan around 25–30 minutes from Newcastle-under-Lyme via the A500 to {{venueName}}.",
    landmarks: "The town's university and retail economy creates B2B demand that chapter members serve across Staffordshire and Cheshire.",
    businessLandscape:
      "Members in marketing, finance, IT and trades refer clients who live or work on both sides of the county border.",
    nearbyTowns: "Stoke-on-Trent, Alsager, Crewe and Kidsgrove",
    ctaHeading: "Visit from Newcastle-under-Lyme",
    ctaBody: "Book a guest place at the next {{meetingDay}} meeting.",
  }),
];
