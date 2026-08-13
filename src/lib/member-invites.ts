import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { memberInvites, type Member, type MemberInvite } from "@/db/schema";
import { getAppOrigin } from "@/lib/clerk-admins";
import {
  getClerkInvitationUrl,
  getClerkUserByEmail,
} from "@/lib/clerk-members";
import { getMemberProfilePath } from "@/lib/members";

export type MemberAccessState =
  | {
      status: "none";
      invite: null;
      linkedEmail: null;
      invitationUrl: null;
    }
  | {
      status: "pending";
      invite: MemberInvite;
      linkedEmail: string;
      invitationUrl: string | null;
    }
  | {
      status: "active";
      invite: MemberInvite | null;
      linkedEmail: string;
      invitationUrl: null;
    };

export async function getLatestMemberInvite(
  memberId: string,
): Promise<MemberInvite | undefined> {
  return db.query.memberInvites.findFirst({
    where: eq(memberInvites.memberId, memberId),
    orderBy: [desc(memberInvites.sentAt)],
  });
}

export async function getMemberAccessState(
  member: Member,
): Promise<MemberAccessState> {
  if (member.clerkUserId) {
    const clerkUser = await getClerkUserByEmail(member.email);
    const linkedEmail =
      clerkUser?.primaryEmailAddress?.emailAddress ?? member.email;

    const invite = await getLatestMemberInvite(member.id);
    return {
      status: "active",
      invite: invite ?? null,
      linkedEmail,
      invitationUrl: null,
    };
  }

  const invite = await db.query.memberInvites.findFirst({
    where: and(
      eq(memberInvites.memberId, member.id),
      ne(memberInvites.status, "revoked"),
    ),
    orderBy: [desc(memberInvites.sentAt)],
  });

  if (!invite) {
    return {
      status: "none",
      invite: null,
      linkedEmail: null,
      invitationUrl: null,
    };
  }

  if (invite.status === "accepted") {
    return {
      status: "active",
      invite,
      linkedEmail: invite.email,
      invitationUrl: null,
    };
  }

  let invitationUrl: string | null = null;
  if (invite.clerkInvitationId) {
    invitationUrl = await getClerkInvitationUrl(invite.clerkInvitationId);
  }

  return {
    status: "pending",
    invite,
    linkedEmail: invite.email,
    invitationUrl,
  };
}

export function getMyProfileUrl() {
  return `${getAppOrigin()}/my-profile`;
}

export function getMemberProfileUrl(member: Pick<Member, "id" | "slug">) {
  return `${getAppOrigin()}${getMemberProfilePath(member)}`;
}

export function getMemberInviteSignUpRedirectUrl(
  member: Pick<Member, "id" | "slug">,
) {
  const url = new URL(`${getAppOrigin()}/sign-up`);
  url.searchParams.set("redirect_url", getMemberProfilePath(member));
  return url.toString();
}

export function getMemberSignInRedirectUrl(member: Pick<Member, "id" | "slug">) {
  const url = new URL(`${getAppOrigin()}/sign-in`);
  url.searchParams.set("redirect_url", getMemberProfilePath(member));
  return url.toString();
}

export async function revokePendingInvitesForMember(memberId: string) {
  await db
    .update(memberInvites)
    .set({ status: "revoked" })
    .where(
      and(
        eq(memberInvites.memberId, memberId),
        eq(memberInvites.status, "pending"),
      ),
    );
}
