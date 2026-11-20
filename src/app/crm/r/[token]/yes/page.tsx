import type { Metadata } from "next";
import { ReminderAction } from "@/components/crm/reminder-actions";
import { ReminderShell } from "@/components/crm/reminder-shell";
import { answerYes, resolveReminderToken } from "@/lib/crm/reminders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thanks",
  robots: { index: false, follow: false },
};

/**
 * "Yes, I've invited them."
 *
 * A GET that writes, which a link prefetcher can therefore trigger. That was
 * the deliberate trade for one tap from an email: the write is idempotent,
 * it is recorded on the visitor's timeline, and Undo is right here.
 */
export default async function ReminderYesPage({
  params,
}: PageProps<"/crm/r/[token]/yes">) {
  const { token } = await params;
  const reminder = await resolveReminderToken(token);

  if (!reminder) {
    return (
      <ReminderShell
        title="That link has expired"
        lead="Reminder links last three weeks. Sign in to the pipeline and you can mark them invited there, or ask in the chapter WhatsApp."
      />
    );
  }

  // An old email can outlive the claim: handed back, or picked up by someone
  // else. Marking them invited would then credit the wrong person.
  if (!reminder.stillOwned) {
    return (
      <ReminderShell
        title={`${reminder.visitorName} isn't on your list any more`}
        lead="They went back to the chapter, so somebody else may be on it now. Nothing to do here — sign in to the pipeline if you want to pick them up again."
      />
    );
  }

  // Pressing Undo records a "no", and the router then renders this page
  // again. Without this branch that render would re-mark them invited and
  // the undo would appear to do nothing.
  if (reminder.alreadyAnswered === "no") {
    return (
      <ReminderShell
        title={`${reminder.visitorName} is back on your list to invite`}
        lead="Nothing is marked against them. We'll check in again next week, and there's a Not yet link in that email if you want the words to send."
      />
    );
  }

  await answerYes(reminder);

  return (
    <ReminderShell
      title={`Nice one — ${reminder.visitorName} is marked as invited`}
      lead="The board has moved them across, so nobody else will ring them. If they say yes to a date, you can set it on their page."
    >
      <div className="mt-6">
        <ReminderAction token={token} kind="undo" />
      </div>
    </ReminderShell>
  );
}
