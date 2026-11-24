import { clerkClient } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { members } from "@/db/schema";
import type { CrmResult } from "@/lib/crm/visitors";

/**
 * Naming a member a chapter admin.
 *
 * Two places have to agree. The member row is the chapter's decision, and
 * can be made before the person has ever signed in. Clerk's public metadata
 * is what the middleware and the page guards actually read. This writes
 * both, so the answer is the same whichever one you ask.
 *
 * Somebody not yet signed up has no Clerk user to write to. That is fine:
 * the row is set now and getCurrentMember() promotes them the first time
 * they appear, which is the whole reason the row exists.
 */
/** Writes the role onto a Clerk user. Replaced in tests. */
export type ApplyClerkRole = (
  clerkUserId: string,
  role: "admin" | "member",
) => Promise<void>;

const applyRoleToClerk: ApplyClerkRole = async (clerkUserId, role) => {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkUserId);
  const metadata = (user.publicMetadata ?? {}) as Record<string, unknown>;
  await client.users.updateUserMetadata(clerkUserId, {
    publicMetadata: { ...metadata, role },
  });
};

export async function setChapterAdmin(
  chapterId: string,
  memberId: string,
  shouldBeAdmin: boolean,
  actingUserId: string,
  /**
   * Injected so the tests can cover the signed-in paths. A fixture cannot
   * have a real Clerk user, and the alternative -- only ever testing
   * members who have never signed in -- would leave the half that matters
   * most unchecked.
   */
  applyToClerk: ApplyClerkRole = applyRoleToClerk,
): Promise<CrmResult<{ name: string; applied: boolean }>> {
  const member = await db.query.members.findFirst({
    where: and(eq(members.id, memberId), eq(members.chapterId, chapterId)),
  });
  if (!member) return { ok: false, error: "Couldn't find them." };

  // Mirrors the site's own admin screen: locking yourself out needs somebody
  // else to let you back in, and there may not be anybody else.
  if (!shouldBeAdmin && member.clerkUserId && member.clerkUserId === actingUserId) {
    return { ok: false, error: "You cannot remove your own admin access." };
  }

  await db
    .update(members)
    .set({ isChapterAdmin: shouldBeAdmin, updatedAt: new Date() })
    .where(and(eq(members.id, memberId), eq(members.chapterId, chapterId)));

  // Nobody to write to yet. The row is enough; it is applied when they join.
  if (!member.clerkUserId) {
    return {
      ok: true,
      data: { name: `${member.firstName} ${member.lastName}`.trim(), applied: false },
    };
  }

  try {
    await applyToClerk(member.clerkUserId, shouldBeAdmin ? "admin" : "member");
  } catch (error) {
    console.error("Could not update Clerk role", error);
    // The row is already set, so a flagged member still gets promoted on
    // their next request. Saying it half-worked is more use than a generic
    // failure that makes somebody press the button again.
    return {
      ok: false,
      error: shouldBeAdmin
        ? "Saved, but Clerk did not take it. They will get it next time they sign in."
        : "Saved here, but Clerk did not take it. Try again in a moment.",
    };
  }

  return {
    ok: true,
    data: { name: `${member.firstName} ${member.lastName}`.trim(), applied: true },
  };
}
