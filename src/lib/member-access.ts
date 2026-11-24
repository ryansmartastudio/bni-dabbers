import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { and, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { memberInvites, members, type Member } from "@/db/schema";
import { getRoleFromClaims, requireAuth, type UserRole } from "@/lib/auth";
import { ENQUIRY_TO_EMAIL } from "@/lib/constants";
import {
  buildMemberLinkedAdminNotice,
  buildMemberLinkedEmail,
} from "@/lib/email/member-linked-email";
import { getCrmUrl } from "@/lib/crm-host";
import { sendEmail } from "@/lib/email/resend";
import { getChapterSettings } from "@/lib/settings";

export type MemberLinkDiagnostics = {
  signedInEmails: string[];
  memberIdInMetadata: string | null;
  pendingInviteEmail: string | null;
};

export function getMemberIdFromClaims(
  sessionClaims: Record<string, unknown> | null | undefined,
): string | null {
  const metadata = sessionClaims?.metadata as { memberId?: string } | undefined;
  return typeof metadata?.memberId === "string" ? metadata.memberId : null;
}

async function getClerkUserEmails(userId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return user.emailAddresses.map((address) =>
    address.emailAddress.trim().toLowerCase(),
  );
}

/**
 * Only the addresses Clerk has actually proved they own.
 *
 * This matters because an email address is what grants access: anyone can add
 * any address to their own Clerk account, so an unverified one is a claim, not
 * a fact. Matching on a claim would let someone sign up, add a member's
 * address without confirming it, and be linked as that member.
 */
async function getVerifiedClerkUserEmails(userId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return user.emailAddresses
    .filter((address) => address.verification?.status === "verified")
    .map((address) => address.emailAddress.trim().toLowerCase());
}

/**
 * The allowlist: an active member of a chapter, by their chapter email.
 *
 * This is what lets members sign themselves up rather than waiting for an
 * invite — the list of people allowed in is simply the list of active
 * members, so there is nothing extra to maintain.
 *
 * `members.email` carries no unique constraint, so two rows can share an
 * address. An ambiguous match links nothing: guessing which member someone is
 * would be worse than making them ask.
 */
async function findMemberIdFromMemberEmails(emails: string[]) {
  if (emails.length === 0) return null;

  const matches = await db
    .select({ id: members.id })
    .from(members)
    .where(
      and(
        inArray(sql`lower(trim(${members.email}))`, emails),
        eq(members.status, "active"),
        isNull(members.clerkUserId),
      ),
    )
    .limit(2);

  return matches.length === 1 ? matches[0]!.id : null;
}

async function getMemberIdForUser(
  userId: string,
  sessionClaims: Record<string, unknown> | null | undefined,
): Promise<string | null> {
  const fromClaims = getMemberIdFromClaims(sessionClaims);
  if (fromClaims) return fromClaims;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const memberId = (user.publicMetadata as { memberId?: string } | undefined)
    ?.memberId;

  return typeof memberId === "string" ? memberId : null;
}

async function findMemberIdFromInviteEmails(emails: string[]) {
  if (emails.length === 0) return null;

  const invite = await db.query.memberInvites.findFirst({
    where: and(
      inArray(memberInvites.email, emails),
      inArray(memberInvites.status, ["pending", "accepted"]),
    ),
    orderBy: [desc(memberInvites.sentAt)],
  });

  if (!invite) return null;

  const member = await db.query.members.findFirst({
    where: eq(members.id, invite.memberId),
  });

  if (!member || member.clerkUserId) {
    return null;
  }

  return invite.memberId;
}

async function acceptInviteForMember(memberId: string, userId: string) {
  const pendingInvite = await db.query.memberInvites.findFirst({
    where: and(
      eq(memberInvites.memberId, memberId),
      eq(memberInvites.status, "pending"),
    ),
    orderBy: [desc(memberInvites.sentAt)],
  });

  if (pendingInvite) {
    await db
      .update(memberInvites)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
      })
      .where(eq(memberInvites.id, pendingInvite.id));
  }
}

async function ensureClerkMemberMetadata(userId: string, memberId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const metadata = (user.publicMetadata ?? {}) as Record<string, unknown>;

  if (metadata.memberId === memberId) {
    return;
  }

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...metadata,
      memberId,
    },
  });
}

async function linkMemberFromClaims(
  userId: string,
  memberId: string,
  options?: { requireInviteRecord?: boolean },
): Promise<Member | null> {
  const member = await db.query.members.findFirst({
    where: eq(members.id, memberId),
  });

  if (!member || member.status !== "active") {
    return null;
  }

  if (member.clerkUserId && member.clerkUserId !== userId) {
    return null;
  }

  if (options?.requireInviteRecord !== false) {
    const invite = await db.query.memberInvites.findFirst({
      where: and(
        eq(memberInvites.memberId, memberId),
        ne(memberInvites.status, "revoked"),
      ),
      orderBy: [desc(memberInvites.sentAt)],
    });

    if (!invite) {
      return null;
    }
  }

  // Conditional, not a plain update: the check above and this write are two
  // round trips, and self sign-up means two people can be inside that gap at
  // once. Letting the second write win would silently steal the first one's
  // account.
  //
  // Split into two statements rather than one OR so that "this is the first
  // link" is decided by the database. Only one request can match an unlinked
  // row, so exactly one notification goes out however many arrive at once;
  // the second statement keeps a re-link idempotent and silent.
  const [firstLink] = await db
    .update(members)
    .set({ clerkUserId: userId, updatedAt: new Date() })
    .where(and(eq(members.id, memberId), isNull(members.clerkUserId)))
    .returning();

  const linked =
    firstLink ??
    (
      await db
        .update(members)
        .set({ updatedAt: new Date() })
        .where(and(eq(members.id, memberId), eq(members.clerkUserId, userId)))
        .returning()
    )[0];

  if (!linked) {
    return null;
  }

  await ensureClerkMemberMetadata(userId, memberId);
  await acceptInviteForMember(memberId, userId);

  if (firstLink) {
    await notifyMemberLinked(firstLink, userId);
  }

  return linked;
}

/**
 * Tell the member, and the chapter, that an account now reaches the pipeline.
 *
 * Member emails are published on the directory and several are shared
 * business inboxes, so control of a mailbox is the whole of the gate. This
 * cannot close that gate, but it means nobody gains access quietly. The
 * copy to the chapter matters most for exactly the shared-inbox case, where
 * the member's own notification lands in the same mailbox as the intruder.
 *
 * Never allowed to break a sign-in: a failure here is logged and swallowed.
 */
async function notifyMemberLinked(member: Member, userId: string) {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const signedInWith =
      user.emailAddresses.find((a) => a.id === user.primaryEmailAddressId)
        ?.emailAddress ?? member.email;

    const settings = await getChapterSettings();
    const when = new Date();

    const toMember = buildMemberLinkedEmail({
      settings,
      member,
      signedInWith,
      pipelineUrl: getCrmUrl(),
      when,
    });
    await sendEmail({
      to: member.email,
      subject: toMember.subject,
      html: toMember.html,
      text: toMember.text,
    });

    if (ENQUIRY_TO_EMAIL) {
      const notice = buildMemberLinkedAdminNotice({
        settings,
        member,
        signedInWith,
        when,
      });
      await sendEmail({
        to: ENQUIRY_TO_EMAIL,
        subject: notice.subject,
        html: notice.html,
        text: notice.text,
      });
    }
  } catch (error) {
    console.error("Could not send the account-linked notice", error);
  }
}

export async function getMemberLinkDiagnostics(): Promise<MemberLinkDiagnostics | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const signedInEmails = await getClerkUserEmails(userId);
  const memberIdInMetadata = await getMemberIdForUser(
    userId,
    sessionClaims as Record<string, unknown>,
  );

  const pendingInvite = await db.query.memberInvites.findFirst({
    where: and(
      inArray(memberInvites.email, signedInEmails),
      eq(memberInvites.status, "pending"),
    ),
    orderBy: [desc(memberInvites.sentAt)],
  });

  return {
    signedInEmails,
    memberIdInMetadata,
    pendingInviteEmail: pendingInvite?.email ?? null,
  };
}

/**
 * Gives a flagged member the Clerk role that actually opens the reports.
 *
 * Clerk's public metadata stays the single thing the middleware, the page
 * guards and the sidebar all read, so nothing else has to change. This is
 * the one place that keeps it in step with the member record, which is
 * where a chapter decides who its admins are -- often before the person has
 * signed up at all.
 *
 * Only ever promotes. Taking admin away is done from the Settings screen
 * that already exists, so a flag nobody has cleared cannot silently
 * reinstate somebody who was removed on purpose.
 *
 * Fails quietly: a Clerk outage must not stop a member reading the board.
 * The next request tries again, and nothing is cached in between.
 */
async function syncChapterAdminRole(
  member: Member,
  userId: string,
  currentRole: UserRole,
): Promise<void> {
  if (!member.isChapterAdmin || currentRole === "admin") return;

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const metadata = (user.publicMetadata ?? {}) as Record<string, unknown>;
    if (metadata.role === "admin") return;

    await client.users.updateUserMetadata(userId, {
      publicMetadata: { ...metadata, role: "admin" },
    });
  } catch (error) {
    console.error("Could not sync chapter admin role", error);
  }
}

export async function getCurrentMember(): Promise<Member | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const member = await resolveCurrentMember(userId, sessionClaims as Record<string, unknown>);
  if (member) {
    await syncChapterAdminRole(
      member,
      userId,
      getRoleFromClaims(sessionClaims as Record<string, unknown>),
    );
  }
  return member;
}

/** The three-tier linker. Unchanged; see the comments on each tier. */
async function resolveCurrentMember(
  userId: string,
  sessionClaims: Record<string, unknown>,
): Promise<Member | null> {

  const byClerkId = await db.query.members.findFirst({
    where: eq(members.clerkUserId, userId),
  });
  if (byClerkId) return byClerkId;

  const memberIdFromMetadata = await getMemberIdForUser(userId, sessionClaims);

  if (memberIdFromMetadata) {
    const linked = await linkMemberFromClaims(userId, memberIdFromMetadata, {
      requireInviteRecord: false,
    });
    if (linked) return linked;
  }

  // Verified only from here down: both remaining tiers turn an email address
  // into access to a member record, so an unproven address must not count.
  const emails = await getVerifiedClerkUserEmails(userId);
  const memberIdFromInvite = await findMemberIdFromInviteEmails(emails);
  if (memberIdFromInvite) {
    const linked = await linkMemberFromClaims(userId, memberIdFromInvite);
    if (linked) return linked;
  }

  const memberIdFromAllowlist = await findMemberIdFromMemberEmails(emails);
  if (!memberIdFromAllowlist) return null;

  return linkMemberFromClaims(userId, memberIdFromAllowlist, {
    requireInviteRecord: false,
  });
}

export async function requireLinkedMember() {
  const context = await requireAuth();
  const member = await getCurrentMember();

  if (!member || member.status !== "active") {
    redirect("/members");
  }

  return { ...context, member };
}

/**
 * The CRM's front door: a signed-in, active, linked member plus their chapter.
 *
 * Returning the chapter alongside the member is the point. Every CRM query
 * takes a chapterId, and getting it from here rather than from a request
 * parameter is what stops one chapter reading another's visitors.
 *
 * Unlike requireLinkedMember this sends an unlinked user to /my-profile, where
 * the existing screen explains why they cannot get in, rather than to a
 * members list that will not tell them anything.
 */
/**
 * A member, and an admin.
 *
 * requireAdmin() sends non-admins to /members, which is the wrong place to
 * land from inside the CRM -- and on the subdomain it is a different host
 * entirely. This keeps people in the CRM they were already in.
 */
export async function requireChapterAdmin() {
  const context = await requireChapterMember();
  if (context.role !== "admin") {
    redirect("/crm");
  }
  return context;
}

export async function requireChapterMember() {
  const context = await requireAuth();
  const member = await getCurrentMember();

  if (!member || member.status !== "active") {
    redirect("/my-profile");
  }

  return { ...context, member, chapterId: member.chapterId };
}

export async function requireMemberAccess(memberId: string) {
  const context = await requireAuth();
  const isAdmin = context.role === "admin";

  if (isAdmin) {
    return { ...context, isAdmin: true as const };
  }

  const member = await getCurrentMember();
  if (!member || member.id !== memberId) {
    throw new Error("You do not have permission to edit this profile.");
  }

  if (member.status !== "active") {
    throw new Error("Your profile access has been revoked.");
  }

  return { ...context, isAdmin: false as const, member };
}

export async function isLinkedMember() {
  const member = await getCurrentMember();
  return Boolean(member && member.status === "active");
}

export async function canUploadHeadshot(userId: string, role: string) {
  if (role === "admin") return true;
  const member = await getCurrentMember();
  return Boolean(member && member.clerkUserId === userId);
}
