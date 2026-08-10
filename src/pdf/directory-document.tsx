import {
  Document,
  Image,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Member } from "@/db/schema";
import type { ChapterSettings } from "@/db/schema";
import { getMemberDisplayName } from "@/lib/members";
import { pdfStyles as styles } from "@/pdf/styles";

export type DirectoryMember = Member & { qrDataUrl?: string };

type DirectoryDocumentProps = {
  members: DirectoryMember[];
  settings: ChapterSettings;
};

export function DirectoryDocument({
  members,
  settings,
}: DirectoryDocumentProps) {
  return (
    <Document title={`${settings.chapterName} Directory`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{settings.chapterName}</Text>
        <Text style={styles.subtitle}>
          {settings.meetingDay}s · {settings.meetingStart}–{settings.meetingEnd} ·{" "}
          {settings.venueName}
        </Text>
        {members.map((member) => (
          <View key={member.id} style={styles.row} wrap={false}>
            {member.headshotUrl ? (
              <Image src={member.headshotUrl} style={{ width: 40, height: 40 }} />
            ) : (
              <View style={{ width: 40, height: 40, backgroundColor: "#f5f5f5" }} />
            )}
            <View style={[styles.cell, { flex: 2 }]}>
              <Text style={styles.memberName}>
                {getMemberDisplayName(member)}
              </Text>
              <Text style={styles.muted}>{member.company}</Text>
              <Text style={styles.muted}>{member.bniSeat}</Text>
            </View>
            <View style={styles.cell}>
              <Text>{member.email}</Text>
              <Text>{member.phone}</Text>
              {member.notes ? (
                <Text style={styles.muted}>Notes: {member.notes}</Text>
              ) : null}
            </View>
            {member.qrDataUrl ? (
              <Image src={member.qrDataUrl} style={styles.qr} />
            ) : null}
          </View>
        ))}
      </Page>
    </Document>
  );
}
