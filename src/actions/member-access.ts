"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { memberInvites, members } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import {
  clearMemberIdFromClerkUser,
  createMemberInvitation,
  getClerkErrorMessage,
  getClerkUserByEmail,
  linkClerkUserToMember,
  revokeClerkMemberInvitation,
} from "@/lib/clerk-members";
import { buildMemberInviteEmail } from "@/lib/email/member-invite-email";
import { sendEmail } from "@/lib/email/resend";
import { requireLinkedMember } from "@/lib/member-access";
import {
  getLatestMemberInvite,
  getMyProfileUrl,
  revokePendingInvitesForMember,
} from "@/lib/member-invites";
import { getMemberById, getMemberProfilePath } from "@/lib/members";
import { resolveProfileVisibility } from "@/lib/profile-visibility";
import { getChapterSettings } from "@/lib/settings";
import {
  memberSelfSchema,
  profileVisibilitySchema,
  type MemberSelfFormValues,
} from "@/lib/validations";

const emailSchema = z.string().trim().email();

function revalidateMemberPaths(member?: { id: string; slug: string | null }) {
  revalidatePath("/");
  revalidatePath("/members");
  revalidatePath("/exports");
  revalidatePath("/my-profile");
  if (member) {
    revalidatePath(getMemberProfilePath(member));
    revalidatePath(`/members/${member.id}/edit`);
  }
}

function normalizeProfileFields(parsed: {
  profileHeadline?: string | null;
  profileSummary?: string | null;
  profileServices?: string[];
  profileIdealReferral?: string | null;
  profileSourceUrl?: string | null;
  profileGeneratedAt?: string | null;
  profilePublished?: boolean;
  profileVisibility?: z.infer<typeof profileVisibilitySchema>;
}) {
  return {
    profileHeadline: parsed.profileHeadline?.trim() || null,
    profileSummary: parsed.profileSummary?.trim() || null,
    profileServices: parsed.profileServices ?? [],
    profileIdealReferral: parsed.profileIdealReferral?.trim() || null,
    profileSourceUrl: parsed.profileSourceUrl?.trim() || null,
    profileGeneratedAt: parsed.profileGeneratedAt
      ? new Date(parsed.profileGeneratedAt)
      : null,
    profilePublished: parsed.profilePublished ?? false,
    profileVisibility: resolveProfileVisibility(parsed.profileVisibility),
  };
}

async function sendMemberInviteEmail(
  member: NonNullable<Awaited<ReturnType<typeof getMemberById>>>,
  inviteUrl: string,
  email: string,
) {
  const settings = await getChapterSettings();
  const { subject, html, text } = buildMemberInviteEmail({
    member,
    settings,
    inviteUrl,
  });

  await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

export async function sendMemberInviteAction(memberId: string, email: string) {
  const { userId } = await requireAdmin();

  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) {
    return { success: false, error: "Enter a valid email address." };
  }

  const member = await getMemberById(memberId);
  if (!member) {
    return { success: false, error: "Member not found." };
  }

  if (member.clerkUserId) {
    return {
      success: false,
      error: "This member already has profile access.",
    };
  }

  const normalizedEmail = parsedEmail.data.toLowerCase();
  const emailsToCheck = Array.from(
    new Set([normalizedEmail, member.email.trim().toLowerCase()]),
  );

  try {
    let existingUser = null;
    for (const email of emailsToCheck) {
      existingUser = await getClerkUserByEmail(email);
      if (existingUser) break;
    }

    if (existingUser) {
      await linkClerkUserToMember(existingUser.id, memberId);
      await revokePendingInvitesForMember(memberId);

      const [invite] = await db
        .insert(memberInvites)
        .values({
          memberId,
          email: normalizedEmail,
          status: "accepted",
          acceptedAt: new Date(),
          sentByUserId: userId,
          lastEmailedAt: new Date(),
        })
        .returning();

      const inviteUrl = getMyProfileUrl();
      let emailSent = true;
      let emailError: string | null = null;

      try {
        await sendMemberInviteEmail(member, inviteUrl, normalizedEmail);
      } catch (error) {
        emailSent = false;
        emailError = getClerkErrorMessage(error);
      }

      revalidateMemberPaths(member);
      return {
        success: true,
        type: "linked" as const,
        email: normalizedEmail,
        invitationUrl: inviteUrl,
        emailSent,
        emailError,
        inviteId: invite.id,
      };
    }

    await revokePendingInvitesForMember(memberId);

    try {
      const invitation = await createMemberInvitation(normalizedEmail, memberId);

      const [invite] = await db
        .insert(memberInvites)
        .values({
          memberId,
          email: normalizedEmail,
          clerkInvitationId: invitation.clerkInvitationId,
          status: "pending",
          sentByUserId: userId,
          lastEmailedAt: new Date(),
        })
        .returning();

      let emailSent = true;
      let emailError: string | null = null;

      if (invitation.invitationUrl) {
        try {
          await sendMemberInviteEmail(
            member,
            invitation.invitationUrl,
            normalizedEmail,
          );
        } catch (error) {
          emailSent = false;
          emailError = getClerkErrorMessage(error);
        }
      } else {
        emailSent = false;
        emailError = "Invite created but no invitation URL was returned.";
      }

      revalidateMemberPaths(member);
      return {
        success: true,
        type: "invited" as const,
        email: normalizedEmail,
        invitationUrl: invitation.invitationUrl,
        emailSent,
        emailError,
        inviteId: invite.id,
      };
    } catch (inviteError) {
      const fallbackUser = await getClerkUserByEmail(normalizedEmail);
      if (!fallbackUser) {
        throw inviteError;
      }

      await linkClerkUserToMember(fallbackUser.id, memberId);

      const [invite] = await db
        .insert(memberInvites)
        .values({
          memberId,
          email: normalizedEmail,
          status: "accepted",
          acceptedAt: new Date(),
          sentByUserId: userId,
          lastEmailedAt: new Date(),
        })
        .returning();

      const inviteUrl = getMyProfileUrl();
      let emailSent = true;
      let emailError: string | null = null;

      try {
        await sendMemberInviteEmail(member, inviteUrl, normalizedEmail);
      } catch (error) {
        emailSent = false;
        emailError = getClerkErrorMessage(error);
      }

      revalidateMemberPaths(member);
      return {
        success: true,
        type: "linked" as const,
        email: normalizedEmail,
        invitationUrl: inviteUrl,
        emailSent,
        emailError,
        inviteId: invite.id,
      };
    }
  } catch (error) {
    return { success: false, error: getClerkErrorMessage(error) };
  }
}

export async function resendMemberInviteAction(memberId: string) {
  await requireAdmin();

  const member = await getMemberById(memberId);
  if (!member) {
    return { success: false, error: "Member not found." };
  }

  if (member.clerkUserId) {
    return {
      success: false,
      error: "This member has already accepted their invitation.",
    };
  }

  const invite = await db.query.memberInvites.findFirst({
    where: and(
      eq(memberInvites.memberId, memberId),
      eq(memberInvites.status, "pending"),
    ),
    orderBy: [desc(memberInvites.sentAt)],
  });

  if (!invite) {
    return { success: false, error: "No pending invitation found." };
  }

  let invitationUrl = getMyProfileUrl();

  if (invite.clerkInvitationId) {
    const { getClerkInvitationUrl } = await import("@/lib/clerk-members");
    invitationUrl =
      (await getClerkInvitationUrl(invite.clerkInvitationId)) ?? invitationUrl;
  }

  try {
    await sendMemberInviteEmail(member, invitationUrl, invite.email);

    await db
      .update(memberInvites)
      .set({ lastEmailedAt: new Date() })
      .where(eq(memberInvites.id, invite.id));

    revalidateMemberPaths(member);
    return {
      success: true,
      invitationUrl,
      emailSent: true,
    };
  } catch (error) {
    return {
      success: false,
      error: getClerkErrorMessage(error),
      invitationUrl,
    };
  }
}

export async function revokeMemberInviteAction(memberId: string) {
  await requireAdmin();

  const member = await getMemberById(memberId);
  if (!member) {
    return { success: false, error: "Member not found." };
  }

  const invite = await db.query.memberInvites.findFirst({
    where: and(
      eq(memberInvites.memberId, memberId),
      eq(memberInvites.status, "pending"),
    ),
    orderBy: [desc(memberInvites.sentAt)],
  });

  if (!invite) {
    return { success: false, error: "No pending invitation to revoke." };
  }

  try {
    if (invite.clerkInvitationId) {
      await revokeClerkMemberInvitation(invite.clerkInvitationId);
    }

    await db
      .update(memberInvites)
      .set({ status: "revoked" })
      .where(eq(memberInvites.id, invite.id));

    revalidateMemberPaths(member);
    return { success: true };
  } catch (error) {
    return { success: false, error: getClerkErrorMessage(error) };
  }
}

export async function removeMemberAccessAction(memberId: string) {
  await requireAdmin();

  const member = await getMemberById(memberId);
  if (!member) {
    return { success: false, error: "Member not found." };
  }

  if (!member.clerkUserId) {
    return { success: false, error: "This member does not have active access." };
  }

  try {
    await clearMemberIdFromClerkUser(member.clerkUserId);

    await db
      .update(members)
      .set({
        clerkUserId: null,
        updatedAt: new Date(),
      })
      .where(eq(members.id, memberId));

    const latestInvite = await getLatestMemberInvite(memberId);
    if (latestInvite && latestInvite.status !== "revoked") {
      await db
        .update(memberInvites)
        .set({ status: "revoked" })
        .where(eq(memberInvites.id, latestInvite.id));
    }

    revalidateMemberPaths(member);
    return { success: true };
  } catch (error) {
    return { success: false, error: getClerkErrorMessage(error) };
  }
}

export async function updateOwnMember(data: MemberSelfFormValues) {
  const { member } = await requireLinkedMember();
  const parsed = memberSelfSchema.parse(data);

  await db
    .update(members)
    .set({
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      company: parsed.company,
      email: parsed.email,
      phone: parsed.phone,
      linkedinUrl: parsed.linkedinUrl || null,
      websiteUrl: parsed.websiteUrl || null,
      headshotUrl: parsed.headshotUrl || null,
      ...normalizeProfileFields(parsed),
      updatedAt: new Date(),
    })
    .where(eq(members.id, member.id));

  revalidateMemberPaths({ id: member.id, slug: member.slug });
  return { success: true };
}
