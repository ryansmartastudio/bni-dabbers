import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { memberInvites, members, type Member } from "@/db/schema";
import { getAuthContext, requireAuth } from "@/lib/auth";

export function getMemberIdFromClaims(
  sessionClaims: Record<string, unknown> | null | undefined,
): string | null {
  const metadata = sessionClaims?.metadata as { memberId?: string } | undefined;
  return typeof metadata?.memberId === "string" ? metadata.memberId : null;
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

async function linkMemberFromClaims(
  userId: string,
  memberId: string,
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

  const [linked] = await db
    .update(members)
    .set({
      clerkUserId: userId,
      updatedAt: new Date(),
    })
    .where(eq(members.id, memberId))
    .returning();

  await acceptInviteForMember(memberId, userId);
  return linked ?? null;
}

export async function getCurrentMember(): Promise<Member | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const byClerkId = await db.query.members.findFirst({
    where: eq(members.clerkUserId, userId),
  });
  if (byClerkId) return byClerkId;

  const memberId = getMemberIdFromClaims(
    sessionClaims as Record<string, unknown>,
  );
  if (!memberId) return null;

  return linkMemberFromClaims(userId, memberId);
}

export async function requireLinkedMember() {
  const context = await requireAuth();
  const member = await getCurrentMember();

  if (!member || member.status !== "active") {
    redirect("/members");
  }

  return { ...context, member };
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
