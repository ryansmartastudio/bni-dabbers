import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { and, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { memberInvites, members, type Member } from "@/db/schema";
import { requireAuth } from "@/lib/auth";

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
  // account. Matching their own id as well keeps a re-link idempotent.
  const [linked] = await db
    .update(members)
    .set({
      clerkUserId: userId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(members.id, memberId),
        or(isNull(members.clerkUserId), eq(members.clerkUserId, userId)),
      ),
    )
    .returning();

  if (!linked) {
    return null;
  }

  await ensureClerkMemberMetadata(userId, memberId);
  await acceptInviteForMember(memberId, userId);
  return linked;
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

export async function getCurrentMember(): Promise<Member | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const byClerkId = await db.query.members.findFirst({
    where: eq(members.clerkUserId, userId),
  });
  if (byClerkId) return byClerkId;

  const memberIdFromMetadata = await getMemberIdForUser(
    userId,
    sessionClaims as Record<string, unknown>,
  );

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
