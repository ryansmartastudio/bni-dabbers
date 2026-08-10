import {
  Document,
  Image,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ChapterSettings, CharityLink } from "@/db/schema";
import {
  getMembersByRoleGroup,
  sortMembersForBooklet,
} from "@/lib/members";
import { CoverPage } from "@/pdf/booklet/cover-page";
import { LeadershipChart } from "@/pdf/booklet/leadership-chart";
import { bookletStyles as styles } from "@/pdf/booklet/styles";
import {
  GUEST_ROWS_PER_PAGE,
  GuestTable,
  MemberTable,
  type BookletMember,
} from "@/pdf/booklet/member-table";

type CharityLinkWithQr = CharityLink & { qrDataUrl: string };

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

  return (
    <Document title={`${settings.chapterName} Meeting Sheet`}>
      <CoverPage
        settings={settings}
        coreValues={settings.coreValues}
        feedbackQrDataUrl={feedbackQrDataUrl}
      />

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeading}>Leadership & Committee</Text>
        <LeadershipChart
          leadership={roleGroups.leadership}
          support={roleGroups.support}
          committee={roleGroups.committee}
        />

        <Text style={[styles.sectionHeading, { marginTop: 16 }]}>
          {settings.charityName}
        </Text>
        {settings.charityLogoUrl ? (
          <Image src={settings.charityLogoUrl} style={{ width: 60, height: 60, marginBottom: 8 }} />
        ) : null}
        {settings.charityParagraph ? (
          <Text style={styles.body}>{settings.charityParagraph}</Text>
        ) : null}

        <View style={styles.qrRow}>
          {charityLinks.map((link) => (
            <View key={link.id} style={styles.qrItem}>
              <Image src={link.qrDataUrl} style={styles.qrImage} />
              <Text style={styles.qrLabel}>{link.label}</Text>
            </View>
          ))}
        </View>

        {settings.bniDabbersBankDetails ? (
          <>
            <Text style={styles.subHeading}>BNI Dabbers bank details</Text>
            <Text style={styles.body}>{settings.bniDabbersBankDetails}</Text>
          </>
        ) : null}
        {settings.bniGlobalBankDetails ? (
          <>
            <Text style={styles.subHeading}>BNI Global bank details</Text>
            <Text style={styles.body}>{settings.bniGlobalBankDetails}</Text>
          </>
        ) : null}
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
