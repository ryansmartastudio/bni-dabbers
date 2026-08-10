import { Image, Text, View } from "@react-pdf/renderer";
import type { Member } from "@/db/schema";
import { CHAPTER_ROLES } from "@/lib/constants";
import {
  formatChapterRoles,
  getMemberDisplayName,
} from "@/lib/members";
import { bookletStyles as styles } from "@/pdf/booklet/styles";

type LeadershipChartProps = {
  leadership: Member[];
  support: Member[];
  committee: Member[];
};

const MEMBERS_PER_ROW = 5;

function getRoleSortIndex(roles: string[]) {
  for (let index = 0; index < CHAPTER_ROLES.length; index += 1) {
    if (roles.includes(CHAPTER_ROLES[index])) return index;
  }
  return CHAPTER_ROLES.length;
}

function sortByRolePriority(members: Member[]) {
  return [...members].sort((a, b) => {
    const byRole =
      getRoleSortIndex(a.chapterRoles) - getRoleSortIndex(b.chapterRoles);
    if (byRole !== 0) return byRole;
    return getMemberDisplayName(a).localeCompare(getMemberDisplayName(b));
  });
}

function chunkMembers<T>(items: T[], size: number) {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

function getInitials(member: Pick<Member, "firstName" | "lastName">) {
  return `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase();
}

function LeadershipNode({
  member,
  rowSize,
}: {
  member: Member;
  rowSize: number;
}) {
  const avatarSize = 24;
  const nodeWidth = `${100 / rowSize}%`;

  return (
    <View style={[styles.leaderNode, { width: nodeWidth }]} wrap={false}>
      {member.headshotUrl ? (
        <Image
          src={member.headshotUrl}
          style={[
            styles.leaderAvatar,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.leaderAvatar,
            styles.leaderAvatarPlaceholder,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        >
          <Text style={styles.leaderInitials}>{getInitials(member)}</Text>
        </View>
      )}
      <Text style={styles.leaderName}>{getMemberDisplayName(member)}</Text>
      <Text style={styles.leaderRole}>
        {formatChapterRoles(member.chapterRoles)}
      </Text>
    </View>
  );
}

function LeadershipTier({
  title,
  members,
  showConnector = false,
}: {
  title: string;
  members: Member[];
  showConnector?: boolean;
}) {
  if (!members.length) return null;

  const sortedMembers = sortByRolePriority(members);
  const rows = chunkMembers(sortedMembers, MEMBERS_PER_ROW);

  return (
    <View wrap={false}>
      {showConnector ? <View style={styles.leaderConnector} /> : null}
      <View style={styles.leaderTier}>
        <Text style={styles.leaderTierLabel}>{title}</Text>
        {rows.map((row, rowIndex) => (
          <View key={`${title}-row-${rowIndex}`} style={styles.leaderTierRow}>
            {row.map((member) => (
              <LeadershipNode
                key={member.id}
                member={member}
                rowSize={row.length}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

export function LeadershipChart({
  leadership,
  support,
  committee,
}: LeadershipChartProps) {
  const hasAny =
    leadership.length > 0 || support.length > 0 || committee.length > 0;

  if (!hasAny) return null;

  return (
    <View style={styles.leadershipChart}>
      <LeadershipTier title="Leadership Team" members={leadership} />
      <LeadershipTier title="Supporting Roles" members={support} showConnector />
      <LeadershipTier title="Committee Members" members={committee} showConnector />
    </View>
  );
}
