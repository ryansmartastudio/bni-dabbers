import { Image, Link, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type { Member } from "@/db/schema";
import {
  formatChapterRoles,
  formatWebsiteLabel,
  getMemberDisplayName,
  hasChapterRoles,
  normalizeWebsiteUrl,
} from "@/lib/members";
import {
  EmailIcon,
  LinkedInMark,
  PhoneIcon,
  WebsiteIcon,
} from "@/pdf/booklet/icons";
import { bookletStyles as styles } from "@/pdf/booklet/styles";

export type BookletMember = Member & { qrDataUrl?: string };

const MEMBER_COLUMNS = [
  { key: "photo", label: "Headshot & LinkedIn", width: "15%" },
  { key: "name", label: "Name & BNI Seat", width: "23%" },
  { key: "company", label: "Company Details", width: "34%" },
  { key: "notes", label: "This Week's Specific / Notes", width: "28%" },
] as const;

const GUEST_COLUMNS = [
  { key: "name", label: "Name", width: "28%" },
  { key: "company", label: "Company", width: "32%" },
  { key: "notes", label: "Notes", width: "40%" },
] as const;

function NotesLines({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.notesLines}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.noteLine} />
      ))}
    </View>
  );
}

function ContactRow({
  icon,
  children,
  href,
}: {
  icon: ReactNode;
  children: string;
  href?: string;
}) {
  const row = (
    <View style={styles.contactRow}>
      <View style={styles.contactIcon}>{icon}</View>
      <Text style={styles.contactText}>{children}</Text>
    </View>
  );

  if (href) {
    return (
      <Link src={href} style={styles.contactLink}>
        {row}
      </Link>
    );
  }

  return row;
}

function TableHeader({
  columns,
}: {
  columns: readonly { label: string; width: string }[];
}) {
  return (
    <View style={styles.tableHeaderRow} fixed>
      {columns.map((column) => (
        <View
          key={column.label}
          style={[styles.tableCell, styles.tableHeaderCell, { width: column.width }]}
        >
          <Text style={styles.tableHeaderText}>{column.label}</Text>
        </View>
      ))}
    </View>
  );
}

function MemberTableRow({ member }: { member: BookletMember }) {
  return (
    <View style={styles.tableBodyRow} wrap={false}>
      <View style={[styles.tableCell, { width: MEMBER_COLUMNS[0].width }]}>
        <View style={styles.photoColumn}>
          {member.headshotUrl ? (
            <Image src={member.headshotUrl} style={styles.headshot} />
          ) : (
            <View style={[styles.headshot, styles.headshotPlaceholder]} />
          )}
          {member.qrDataUrl ? (
            <View style={styles.linkedInBlock}>
              <Image src={member.qrDataUrl} style={styles.linkedInQr} />
              <View style={styles.linkedInBadge}>
                <LinkedInMark size={10} />
                <Text style={styles.linkedInLabel}>LinkedIn</Text>
              </View>
            </View>
          ) : (
            <View style={styles.linkedInMissing}>
              <LinkedInMark size={10} />
              <Text style={styles.linkedInMissingText}>No LinkedIn</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.tableCell, { width: MEMBER_COLUMNS[1].width }]}>
        <Text style={styles.memberName}>{getMemberDisplayName(member)}</Text>
        <Text style={styles.memberSeat}>{member.bniSeat}</Text>
        {hasChapterRoles(member.chapterRoles) ? (
          <Text style={styles.memberRoles}>
            {formatChapterRoles(member.chapterRoles)}
          </Text>
        ) : null}
      </View>

      <View style={[styles.tableCell, { width: MEMBER_COLUMNS[2].width }]}>
        <Text style={styles.companyName}>{member.company}</Text>
        <View style={styles.contactList}>
          <ContactRow icon={<EmailIcon />} href={`mailto:${member.email}`}>
            {member.email}
          </ContactRow>
          <ContactRow icon={<PhoneIcon />} href={`tel:${member.phone.replace(/\s/g, "")}`}>
            {member.phone}
          </ContactRow>
          {member.websiteUrl ? (
            <ContactRow
              icon={<WebsiteIcon />}
              href={normalizeWebsiteUrl(member.websiteUrl)}
            >
              {formatWebsiteLabel(member.websiteUrl)}
            </ContactRow>
          ) : null}
        </View>
      </View>

      <View style={[styles.tableCell, styles.notesCell, { width: MEMBER_COLUMNS[3].width }]}>
        <NotesLines />
      </View>
    </View>
  );
}

function GuestTableRow() {
  return (
    <View style={styles.guestBodyRow} wrap={false}>
      <View style={[styles.tableCell, { width: GUEST_COLUMNS[0].width }]}>
        <View style={styles.guestWriteLine} />
      </View>
      <View style={[styles.tableCell, { width: GUEST_COLUMNS[1].width }]}>
        <View style={styles.guestWriteLine} />
      </View>
      <View style={[styles.tableCell, styles.notesCell, { width: GUEST_COLUMNS[2].width }]}>
        <NotesLines count={2} />
      </View>
    </View>
  );
}

export function MemberTable({ members }: { members: BookletMember[] }) {
  return (
    <View style={styles.table} wrap>
      <TableHeader columns={MEMBER_COLUMNS} />
      {members.map((member) => (
        <MemberTableRow key={member.id} member={member} />
      ))}
    </View>
  );
}

export function GuestTable({ rowCount }: { rowCount: number }) {
  return (
    <View style={styles.table} wrap>
      <TableHeader columns={GUEST_COLUMNS} />
      {Array.from({ length: rowCount }, (_, index) => (
        <GuestTableRow key={`guest-row-${index}`} />
      ))}
    </View>
  );
}

export const GUEST_ROWS_PER_PAGE = 14;
