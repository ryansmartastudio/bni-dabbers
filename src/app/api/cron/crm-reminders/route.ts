import { NextResponse } from "next/server";
import { buildCrmReminderEmail } from "@/lib/email/crm-reminder-email";
import { sendEmail } from "@/lib/email/resend";
import {
  MAX_ATTEMPTS,
  findDueReminders,
  markReminderSent,
  recordReminder,
  type DueReminder,
} from "@/lib/crm/reminders";
import { getCrmUrl } from "@/lib/crm-host";
import { isAuthorisedCron } from "@/lib/cron-auth";
import { getChapterSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/**
 * One member claiming thirty visitors must not mean thirty emails on one
 * morning. The rest wait for tomorrow's run; the weekly gap is per visitor,
 * so nothing is lost by trickling them out.
 */
const MAX_PER_MEMBER_PER_RUN = 3;

function thin(due: DueReminder[]): { send: DueReminder[]; held: DueReminder[] } {
  const perMember = new Map<string, number>();
  const send: DueReminder[] = [];
  const held: DueReminder[] = [];

  for (const item of due) {
    const sent = perMember.get(item.memberId) ?? 0;
    if (sent >= MAX_PER_MEMBER_PER_RUN) {
      held.push(item);
      continue;
    }
    perMember.set(item.memberId, sent + 1);
    send.push(item);
  }

  return { send, held };
}

/**
 * The weekly nudge, run daily.
 *
 * `?dry=1` reports exactly who would be emailed and why without sending a
 * thing. These are real members' inboxes, so the first live run should be one
 * somebody has looked at first.
 */
export async function GET(request: Request) {
  if (!isAuthorisedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dry = new URL(request.url).searchParams.get("dry") === "1";
  const now = new Date();
  const due = await findDueReminders(now);
  const { send, held } = thin(due);

  if (dry) {
    return NextResponse.json({
      dryRun: true,
      at: now.toISOString(),
      wouldSend: send.length,
      heldForTomorrow: held.length,
      detail: send.map((item) => ({
        to: item.memberEmail,
        visitor: item.visitorName,
        attempt: `${item.attempt} of ${MAX_ATTEMPTS}`,
        why: item.reason,
      })),
    });
  }

  const settings = await getChapterSettings();
  const sent: string[] = [];
  const failed: { visitor: string; error: string }[] = [];

  for (const item of send) {
    try {
      // The row is written first and stamped last: a crash in between leaves
      // a row that looks unsent, and only stamped rows count towards the cap.
      const { reminderId, token } = await recordReminder(item, now);
      const email = buildCrmReminderEmail({
        settings,
        memberFirstName: item.memberFirstName,
        visitorName: item.visitorName,
        visitorCompany: item.visitorCompany,
        attempt: item.attempt,
        maxAttempts: MAX_ATTEMPTS,
        yesUrl: getCrmUrl(`/r/${token}/yes`),
        noUrl: getCrmUrl(`/r/${token}/no`),
      });

      await sendEmail({
        to: item.memberEmail,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      await markReminderSent(reminderId, item, now);
      sent.push(`${item.memberEmail} → ${item.visitorName}`);
    } catch (error) {
      failed.push({
        visitor: item.visitorName,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  return NextResponse.json({
    at: now.toISOString(),
    sent: sent.length,
    heldForTomorrow: held.length,
    failed,
  });
}
