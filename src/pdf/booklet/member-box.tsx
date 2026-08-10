import { Image, Link, Text, View } from "@react-pdf/renderer";
import type { Member } from "@/db/schema";
import {
  formatWebsiteLabel,
  getMemberDisplayName,
  normalizeWebsiteUrl,
} from "@/lib/members";
import { bookletStyles as styles } from "@/pdf/booklet/styles";

export type BookletMember = Member & { qrDataUrl?: string };

type MemberBoxProps = {
  member?: BookletMember;
  blank?: boolean;
};

export function MemberBox({ member, blank = false }: MemberBoxProps) {
  return (
    <View style={styles.memberBox}>
      {blank ? (
        <>
          <Text style={styles.memberName}>Guest / Visitor</Text>
          <View style={styles.notesArea}>
            <Text style={styles.notesLabel}>Notes</Text>
            <View style={styles.ruledLine} />
            <View style={styles.ruledLine} />
            <View style={styles.ruledLine} />
          </View>
        </>
      ) : member ? (
        <>
          <View style={styles.memberBoxHeader}>
            {member.headshotUrl ? (
              <Image src={member.headshotUrl} style={styles.headshot} />
            ) : (
              <View style={styles.headshot} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>
                {getMemberDisplayName(member)}
              </Text>
              <Text style={styles.memberCompany}>{member.company}</Text>
              <Text style={styles.memberSeat}>{member.bniSeat}</Text>
              {member.chapterRole ? (
                <Text style={styles.memberCompany}>{member.chapterRole}</Text>
              ) : null}
            </View>
            {member.qrDataUrl ? (
              <Image src={member.qrDataUrl} style={{ width: 36, height: 36 }} />
            ) : null}
          </View>
          <Text style={styles.contactLine}>{member.email}</Text>
          <Text style={styles.contactLine}>{member.phone}</Text>
          {member.websiteUrl ? (
            <Link
              src={normalizeWebsiteUrl(member.websiteUrl)}
              style={styles.contactLine}
            >
              {formatWebsiteLabel(member.websiteUrl)}
            </Link>
          ) : null}
          <View style={styles.notesArea}>
            <Text style={styles.notesLabel}>Notes</Text>
            <View style={styles.ruledLine} />
            <View style={styles.ruledLine} />
            <View style={styles.ruledLine} />
          </View>
        </>
      ) : null}
    </View>
  );
}

export function MemberBoxGrid({
  items,
  blank = false,
}: {
  items: (BookletMember | null)[];
  blank?: boolean;
}) {
  return (
    <View style={styles.boxGrid}>
      {items.map((item, index) => (
        <MemberBox
          key={blank ? `blank-${index}` : item?.id ?? index}
          member={item ?? undefined}
          blank={blank}
        />
      ))}
    </View>
  );
}

export const BOXES_PER_PAGE = 4;

export function chunkMembers<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
