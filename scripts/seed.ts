import { db } from "../src/db";
import { chapterSettings, charityLinks, members } from "../src/db/schema";

async function seed() {
  const existingSettings = await db.query.chapterSettings.findFirst();
  if (!existingSettings) {
    await db.insert(chapterSettings).values({
      charityParagraph:
        "Genie's Wish supports children and young people facing life-threatening conditions. BNI Dabbers is proud to support this chosen charity.",
      charityFootnote:
        "The Genie's Wish is a UK-registered charity, operating since 2021.\n\nOur purpose is to enhance the lives of people aged between Birth to 40 years of age who are living with a terminal or serious illness or life-limiting condition.\n\nWe also grant wishes for Young Carers aged between 5 and 18, including experiences, special events and group activities, in recognition of their bravery, kindness and selflessness in caring for a family member. Through life-changing wishes, ongoing opportunities and unforgettable experiences, we bring joy, hope and meaningful moments to our beneficiaries and their families.",
      bniDabbersBankDetails: "BNI Dabbers — sort code and account to be added",
      bniGlobalBankDetails: "BNI Global — sort code and account to be added",
    });
  }

  const existingLinks = await db.query.charityLinks.findMany();
  if (!existingLinks.length) {
    await db.insert(charityLinks).values([
      {
        label: "Genie's Wish website",
        url: "https://www.geneswish.org.uk",
        sortOrder: 0,
        placement: "charity",
      },
      {
        label: "Donate to Genie's Wish",
        url: "https://www.geneswish.org.uk/donate",
        sortOrder: 1,
        placement: "charity",
      },
      {
        label: "Easy Fundraising Sign Up",
        url: "https://www.easyfundraising.org.uk/",
        sortOrder: 2,
        placement: "charity",
      },
      {
        label: "BNI Dabbers chapter page",
        url: "https://www.bni-ce.co.uk/cheshire-east-dabbers",
        sortOrder: 3,
        placement: "cover",
      },
    ]);
  }

  const existingMembers = await db.query.members.findMany();
  if (!existingMembers.length) {
    await db.insert(members).values([
      {
        firstName: "Ryan",
        lastName: "McCandless",
        company: "Smartastudio",
        bniSeat: "Web Design",
        email: "ryan@example.com",
        phone: "07000 000000",
        linkedinUrl: "https://www.linkedin.com/in/example",
        websiteUrl: "https://www.smartastudio.co.uk",
        chapterRoles: ["President"],
        roleGroup: "leadership",
        sortOrder: 0,
      },
      {
        firstName: "Sample",
        lastName: "Member",
        company: "Example Ltd",
        bniSeat: "Accountant",
        email: "member@example.com",
        phone: "07000 000001",
        sortOrder: 1,
      },
    ]);
  }

  console.log("Seed complete");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
