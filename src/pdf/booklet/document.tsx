import {
  Document,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ChapterSettings } from "@/db/schema";
import {
  splitCharityLinksForBooklet,
  type CharityLinkWithQr,
} from "@/lib/charity-links";
import {
  getMembersByRoleGroup,
  sortMembersForBooklet,
} from "@/lib/members";
import { CharitySection } from "@/pdf/booklet/charity-section";
import { CoverPage } from "@/pdf/booklet/cover-page";
import { LeadershipChart } from "@/pdf/booklet/leadership-chart";
import { bookletStyles as styles } from "@/pdf/booklet/styles";
import {
  GUEST_ROWS_PER_PAGE,
  GuestTable,
  MemberTable,
  type BookletMember,
} from "@/pdf/booklet/member-table";

type BookletDocumentProps = {
  settings: ChapterSettings;
  members: BookletMember[];
  charityLinks: CharityLinkWithQr[];
  feedbackQrDataUrl?: string;
};

export function BookletDocument({
  settings,
  members,
  charityLinks,
  feedbackQrDataUrl,
}: BookletDocumentProps) {
  const roleGroups = getMembersByRoleGroup(members);
  const sortedMembers = sortMembersForBooklet(members);
  const guestPageCount = Math.max(settings.guestPageCount, 1);
  const { coverLinks, charityLinks: charitySectionLinks } =
    splitCharityLinksForBooklet(charityLinks);

  return (
    <Document title={`${settings.chapterName} Meeting Sheet`}>
      <CoverPage
        settings={settings}
        coreValues={settings.coreValues}
        feedbackQrDataUrl={feedbackQrDataUrl}
        chapterQrLink={coverLinks[0]}
      />

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeading}>Leadership & Committee</Text>
        <LeadershipChart
          leadership={roleGroups.leadership}
          support={roleGroups.support}
          committee={roleGroups.committee}
        />
      </Page>

      <Page size="A4" style={styles.page}>
        <CharitySection settings={settings} links={charitySectionLinks} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeading}>This week</Text>
        <View style={styles.slotBox}>
          <Text style={styles.slotTitle}>10-minute presentation</Text>
          <Text style={styles.body}>
            {settings.presentationSlot || " "}
          </Text>
        </View>
        <View style={styles.slotBox}>
          <Text style={styles.slotTitle}>Education slot</Text>
          <Text style={styles.body}>{settings.educationSlot || " "}</Text>
        </View>
        <View style={styles.slotBox}>
          <Text style={styles.slotTitle}>Training & events</Text>
          <Text style={styles.body}>{settings.trainingEvents || " "}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.pageTitle}>{settings.chapterName} Members</Text>
        <Text style={styles.pageSubtitle}>
          Scan LinkedIn QR codes to connect · use the notes column for this week
        </Text>
        <MemberTable members={sortedMembers} />
      </Page>

      {Array.from({ length: guestPageCount }, (_, index) => (
        <Page key={`guests-${index}`} size="A4" style={styles.guestPage} wrap={false}>
          <Text style={[styles.pageTitle, { marginBottom: 6 }]}>
            Guests & Visitors
          </Text>
          <Text style={[styles.pageSubtitle, { marginBottom: 8 }]}>
            {guestPageCount > 1
              ? `Page ${index + 1} of ${guestPageCount}`
              : "Record guest details during the meeting"}
          </Text>
          <GuestTable rowCount={GUEST_ROWS_PER_PAGE} />
        </Page>
      ))}
    </Document>
  );
}
