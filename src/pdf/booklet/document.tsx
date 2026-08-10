import {
  Document,
  Image,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ChapterSettings, CharityLink, Member } from "@/db/schema";
import {
  formatChapterRoles,
  getMemberDisplayName,
  getMembersByRoleGroup,
  sortMembersForBooklet,
} from "@/lib/members";
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
};

function RoleSection({
  title,
  rows,
}: {
  title: string;
  rows: Member[];
}) {
  if (!rows.length) return null;
  return (
    <View>
      <Text style={styles.subHeading}>{title}</Text>
      {rows.map((member) => (
        <View key={member.id} style={styles.roleRow}>
          <Text style={styles.roleTitle}>
            {formatChapterRoles(member.chapterRoles)}
          </Text>
          <Text style={styles.roleName}>{getMemberDisplayName(member)}</Text>
        </View>
      ))}
    </View>
  );
}

export function BookletDocument({
  settings,
  members,
  charityLinks,
}: BookletDocumentProps) {
  const roleGroups = getMembersByRoleGroup(members);
  const sortedMembers = sortMembersForBooklet(members);
  const guestRowCount =
    Math.max(settings.guestPageCount, 1) * GUEST_ROWS_PER_PAGE;

  return (
    <Document title={`${settings.chapterName} Meeting Sheet`}>
      <Page size="A4" style={styles.page}>
        {settings.chapterLogoUrl ? (
          <Image
            src={settings.chapterLogoUrl}
            style={{ width: 80, height: 80, alignSelf: "center" }}
          />
        ) : null}
        <Text style={styles.coverTitle}>WELCOME TO {settings.chapterName.toUpperCase()}</Text>
        <Text style={styles.coverSubtitle}>{settings.websiteUrl}</Text>
        <Text style={styles.coverSubtitle}>
          {settings.venueName}, {settings.venueAddress}
        </Text>
        <Text style={styles.coverAccent}>
          {settings.meetingDay}s · {settings.meetingStart} – {settings.meetingEnd}
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeading}>Leadership & Committee</Text>
        <RoleSection title="Leadership Team" rows={roleGroups.leadership} />
        <RoleSection title="Supporting Roles" rows={roleGroups.support} />
        <RoleSection title="Committee Members" rows={roleGroups.committee} />

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

      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.pageTitle}>Guests & Visitors</Text>
        <Text style={styles.pageSubtitle}>
          Record guest details during the meeting
        </Text>
        <GuestTable rowCount={guestRowCount} />
      </Page>
    </Document>
  );
}
