"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  getClerkErrorMessage,
  inviteAdmin,
  removeAdminAccess,
  revokeAdminInvite,
} from "@/lib/clerk-admins";

const emailSchema = z.string().trim().email();

export async function inviteAdminAction(email: string) {
  await requireAdmin();

  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { success: false, error: "Enter a valid email address." };
  }

  try {
    const result = await inviteAdmin(parsed.data);
    revalidatePath("/settings");
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: getClerkErrorMessage(error) };
  }
}

export async function revokeAdminInviteAction(invitationId: string) {
  await requireAdmin();

  try {
    await revokeAdminInvite(invitationId);
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: getClerkErrorMessage(error) };
  }
}

export async function removeAdminAccessAction(userId: string) {
  const { userId: currentUserId } = await requireAdmin();

  try {
    await removeAdminAccess(userId, currentUserId);
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: getClerkErrorMessage(error) };
  }
}
