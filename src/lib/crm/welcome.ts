import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { crmVisitors, members } from "@/db/schema";
import { getCrmUrl } from "@/lib/crm-host";
import { buildCrmWelcomeEmail } from "@/lib/email/crm-welcome-email";
import { sendEmailBatch } from "@/lib/email/resend";
import { getChapterSettings } from "@/lib/settings";
import type { CrmResult } from "@/lib/crm/visitors";

/**
 * Telling the chapter the CRM exists.
 *
 * Runs on the server rather than from somebody's laptop because that is
 * where the Resend key lives: it is marked sensitive in Vercel, so it never
 * comes back down with `vercel env pull`, and the alternative was asking a
 * human to keep a live API key in a file on their machine.
 */

/** Resend's own ceiling on one batch, and a sane ceiling on one click. */
export const MAX_WELCOME_BATCH = 100;

export type WelcomeRecipient = {
  id: string;
  name: string;
  email: string;
  seat: string;
  /** They have signed in at least once, so they already know it exists. */
  signedIn: boolean;
  /** When we last told them, or null. */
  emailedAt: string | null;
};

export async function listWelcomeRecipients(
  chapterId: string,
): Promise<WelcomeRecipient[]> {
  const rows = await db
    .select({
      id: members.id,
      firstName: members.firstName,
      lastName: members.lastName,
      email: members.email,
      seat: members.bniSeat,
      clerkUserId: members.clerkUserId,
      sentAt: members.crmWelcomeSentAt,
    })
    .from(members)
    .where(and(eq(members.chapterId, chapterId), eq(members.status, "active")))
    .orderBy(asc(members.firstName), asc(members.lastName));

  return rows.map((row) => ({
    id: row.id,
    name: `${row.firstName} ${row.lastName}`.trim(),
    email: row.email,
    seat: row.seat,
    signedIn: row.clerkUserId !== null,
    emailedAt: row.sentAt?.toISOString() ?? null,
  }));
}

export type WelcomeSendResult = {
  sent: number;
  failures: { name: string; email: string; message: string }[];
  /** Asked for but not sent, because they have no usable address. */
  skipped: { name: string; reason: string }[];
};

/**
 * Sends the welcome email to the members named, and records that it went.
 *
 * Takes explicit ids rather than a filter so the count the admin confirmed
 * is the count that gets emailed. A filter evaluated again here could widen
 * between the page rendering and the button being pressed, and "it emailed
 * more people than the screen said" is not a mistake you can take back.
 */
export async function sendWelcomeEmails(
  chapterId: string,
  memberIds: string[],
  /**
   * How the emails actually go out. Injected rather than imported so the
   * tests can assert the exact recipients and bodies without reaching
   * anybody's inbox -- the failure this guards against is emailing the
   * wrong people, which you cannot discover by sending and looking.
   */
  send: typeof sendEmailBatch = sendEmailBatch,
): Promise<CrmResult<WelcomeSendResult>> {
  const wanted = [...new Set(memberIds)];
  if (wanted.length === 0) return { ok: false, error: "Nobody was selected." };
  if (wanted.length > MAX_WELCOME_BATCH) {
    return {
      ok: false,
      error: `${MAX_WELCOME_BATCH} at a time is the limit.`,
    };
  }

  // Scoped by chapter here, not by the caller, so an id from somewhere else
  // simply is not found.
  const rows = await db
    .select({
      id: members.id,
      firstName: members.firstName,
      lastName: members.lastName,
      email: members.email,
    })
    .from(members)
    .where(
      and(
        eq(members.chapterId, chapterId),
        eq(members.status, "active"),
        inArray(members.id, wanted),
      ),
    );

  if (rows.length === 0) return { ok: false, error: "Nobody was found." };

  const settings = await getChapterSettings();
  const [counts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      unclaimed: sql<number>`count(*) filter (where ${crmVisitors.ownerMemberId} is null)::int`,
    })
    .from(crmVisitors)
    .where(
      and(eq(crmVisitors.chapterId, chapterId), isNull(crmVisitors.archivedAt)),
    );

  const skipped: WelcomeSendResult["skipped"] = [];
  const sendable: { id: string; name: string; email: string; built: ReturnType<typeof buildCrmWelcomeEmail> }[] = [];

  for (const row of rows) {
    const name = `${row.firstName} ${row.lastName}`.trim();
    const email = row.email.trim();
    // The email tells people to sign in with the address it arrived at, so
    // an empty or malformed one would be an instruction that cannot be
    // followed. Better to say who was left out.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      skipped.push({ name, reason: "No usable email address on their record." });
      continue;
    }
    sendable.push({
      id: row.id,
      name,
      email,
      built: buildCrmWelcomeEmail({
        settings,
        member: { firstName: row.firstName, email },
        crmUrl: getCrmUrl("/"),
        toolkitUrl: getCrmUrl("/toolkit"),
        unclaimedCount: counts?.unclaimed ?? 0,
        totalCount: counts?.total ?? 0,
      }),
    });
  }

  if (sendable.length === 0) {
    return { ok: false, error: "Nobody selected has a usable email address." };
  }

  const result = await send(
    sendable.map((entry) => ({
      to: entry.email,
      subject: entry.built.subject,
      html: entry.built.html,
      text: entry.built.text,
    })),
  );

  const failedIndexes = new Set(result.failures.map((failure) => failure.index));
  const delivered = sendable.filter((_, index) => !failedIndexes.has(index));

  // Only the ones that actually went are stamped, so a retry picks up
  // exactly the people who missed out rather than emailing everyone twice.
  if (delivered.length > 0) {
    await db
      .update(members)
      .set({ crmWelcomeSentAt: new Date() })
      .where(
        and(
          eq(members.chapterId, chapterId),
          inArray(
            members.id,
            delivered.map((entry) => entry.id),
          ),
        ),
      );
  }

  return {
    ok: true,
    data: {
      sent: delivered.length,
      failures: result.failures.map((failure) => ({
        name: sendable[failure.index]?.name ?? "Unknown",
        email: sendable[failure.index]?.email ?? "",
        message: failure.message,
      })),
      skipped,
    },
  };
}
