"use server";

import { revalidatePath } from "next/cache";
import {
  markInvitedFromReminder,
  releaseFromReminder,
  resolveReminderToken,
  undoYes,
} from "@/lib/crm/reminders";

/**
 * The two buttons on the pages a reminder email leads to.
 *
 * These are the only server actions in the CRM with no signed-in member
 * behind them. The token is the credential: single-purpose, time-limited,
 * and stored only as a hash, so holding one proves you were sent that
 * particular email. Each action still re-resolves it rather than trusting
 * anything passed alongside.
 */

export type Result = { ok: true } | { ok: false; error: string };

const GONE = "That link has expired. Ask in the chapter WhatsApp and somebody will sort it.";

export async function undoInvited(token: string): Promise<Result> {
  const reminder = await resolveReminderToken(token);
  if (!reminder) return { ok: false, error: GONE };

  const result = await undoYes(reminder);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/crm");
  return { ok: true };
}

export async function releaseToPool(token: string): Promise<Result> {
  const reminder = await resolveReminderToken(token);
  if (!reminder) return { ok: false, error: GONE };
  if (!reminder.stillOwned) {
    return { ok: false, error: "They've already gone back to the chapter." };
  }

  const result = await releaseFromReminder(reminder);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/crm");
  return { ok: true };
}

/** "Actually, I've just sent it", from the Not yet page. */
export async function markInvited(token: string): Promise<Result> {
  const reminder = await resolveReminderToken(token);
  if (!reminder) return { ok: false, error: GONE };
  if (!reminder.stillOwned) {
    return { ok: false, error: "They've already gone back to the chapter." };
  }

  const result = await markInvitedFromReminder(reminder);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/crm");
  return { ok: true };
}
