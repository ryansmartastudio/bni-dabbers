"use client";

import { useAuth } from "@clerk/nextjs";
import type { Member } from "@/db/schema";
import { MemberBacklinkBadge } from "@/components/directory/member-backlink-badge";

type MemberBacklinkBadgeGateProps = {
  member: Member;
  chapterName?: string;
};

export function MemberBacklinkBadgeGate({
  member,
  chapterName,
}: MemberBacklinkBadgeGateProps) {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return null;
  }

  return <MemberBacklinkBadge member={member} chapterName={chapterName} />;
}
