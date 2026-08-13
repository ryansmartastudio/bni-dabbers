import { clerkClient } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { memberInvites, members, type Member } from "@/db/schema";
import { getRoleFromPublicMetadata } from "@/lib/auth";
import { getClerkErrorMessage } from "@/lib/clerk-admins";
import { getMemberInviteSignUpRedirectUrl } from "@/lib/member-invites";

export { getClerkErrorMessage };

function getUserPublicMetadata(
  metadata: Record<string, unknown> | null | undefined,
) {
  return metadata ?? {};
}

export async function getClerkUserByEmail(email: string) {
  const client = await clerkClient();
  const { data } = await client.users.getUserList({
    emailAddress: [email.trim().toLowerCase()],
  });
  return data[0] ?? null;
}

async function assertNotLinkedToOtherMember(
  clerkUserId: string,
  memberId: string,
) {
  const existing = await db.query.members.findFirst({
    where: eq(members.clerkUserId, clerkUserId),
  });

  if (existing && existing.id !== memberId) {
    throw new Error(
      "This account is already linked to another member profile.",
    );
  }
}

export async function linkClerkUserToMember(
  clerkUserId: string,
  memberId: string,
) {
  await assertNotLinkedToOtherMember(clerkUserId, memberId);

  const client = await clerkClient();
  const user = await client.users.getUser(clerkUserId);

  await client.users.updateUserMetadata(clerkUserId, {
    publicMetadata: {
      ...getUserPublicMetadata(user.publicMetadata as Record<string, unknown>),
      memberId,
    },
  });

  await db
    .update(members)
    .set({
      clerkUserId,
      updatedAt: new Date(),
    })
    .where(eq(members.id, memberId));
}

export async function createMemberInvitation(
  emailAddress: string,
  member: Pick<Member, "id" | "slug">,
) {
  const email = emailAddress.trim().toLowerCase();
  const client = await clerkClient();

  const invitation = await client.invitations.createInvitation({
    emailAddress: email,
    redirectUrl: getMemberInviteSignUpRedirectUrl(member),
    publicMetadata: {
      role: "member",
      memberId: member.id,
    },
    notify: false,
  });

  return {
    email,
    invitationUrl: invitation.url ?? null,
    clerkInvitationId: invitation.id,
  };
}

export async function revokeClerkMemberInvitation(invitationId: string) {
  const client = await clerkClient();
  await client.invitations.revokeInvitation(invitationId);
}

export async function getClerkInvitationUrl(invitationId: string) {
  const client = await clerkClient();
  const { data } = await client.invitations.getInvitationList({
    status: "pending",
  });
  const invitation = data.find((item) => item.id === invitationId);
  return invitation?.url ?? null;
}

export async function clearMemberIdFromClerkUser(clerkUserId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkUserId);
  const metadata = getUserPublicMetadata(
    user.publicMetadata as Record<string, unknown>,
  );
  const { memberId: _removed, ...rest } = metadata as {
    memberId?: string;
    [key: string]: unknown;
  };

  await client.users.updateUserMetadata(clerkUserId, {
    publicMetadata: rest,
  });
}

async function revokePendingClerkInvitesForMember(memberId: string) {
  const pendingInvites = await db.query.memberInvites.findMany({
    where: and(
      eq(memberInvites.memberId, memberId),
      eq(memberInvites.status, "pending"),
    ),
  });

  for (const invite of pendingInvites) {
    if (!invite.clerkInvitationId) continue;

    try {
      await revokeClerkMemberInvitation(invite.clerkInvitationId);
    } catch {
      // Invitation may already be accepted or revoked in Clerk.
    }
  }
}

export async function removeClerkAccessForMember(
  member: Pick<Member, "id" | "clerkUserId">,
) {
  await revokePendingClerkInvitesForMember(member.id);

  if (!member.clerkUserId) {
    return;
  }

  const client = await clerkClient();
  const user = await client.users.getUser(member.clerkUserId);
  const role = getRoleFromPublicMetadata(
    user.publicMetadata as Record<string, unknown>,
  );

  if (role === "admin") {
    await clearMemberIdFromClerkUser(member.clerkUserId);
    return;
  }

  await client.users.deleteUser(member.clerkUserId);
}
