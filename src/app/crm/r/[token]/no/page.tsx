import type { Metadata } from "next";
import { MessagePicker } from "@/components/crm/message-picker";
import { ReminderAction } from "@/components/crm/reminder-actions";
import { ReminderShell } from "@/components/crm/reminder-shell";
import { getChapterMessageFacts } from "@/lib/crm/message-facts";
import { answerNo, resolveReminderToken } from "@/lib/crm/reminders";
import { getVisitor } from "@/lib/crm/visitors";
import { INVITE_TIPS } from "@/lib/workshop/toolkit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "No rush",
  robots: { index: false, follow: false },
};

/**
 * "Not yet."
 *
 * Not a telling-off. Somebody who admits they haven't got round to it is
 * exactly the person to hand the words to -- and, if they'd rather, the way
 * to give the visitor back to the chapter.
 */
export default async function ReminderNoPage({
  params,
}: PageProps<"/crm/r/[token]/no">) {
  const { token } = await params;
  const reminder = await resolveReminderToken(token);

  if (!reminder) {
    return (
      <ReminderShell
        title="That link has expired"
        lead="Reminder links last three weeks. Sign in to the pipeline to pick up where you left off."
      />
    );
  }

  if (reminder.alreadyAnswered === "yes") {
    return (
      <ReminderShell
        title={`${reminder.visitorName} is already marked as invited`}
        lead="Nothing more to do here. If that's wrong, sign in to the pipeline and you can move them back."
      />
    );
  }

  await answerNo(reminder);

  // Reached from an email without signing in, so the chapter comes off the
  // token's own reminder row rather than from a session.
  const [visitor, facts] = await Promise.all([
    getVisitor(reminder.chapterId, reminder.visitorId),
    getChapterMessageFacts(reminder.chapterId),
  ]);

  return (
    <ReminderShell
      title="No rush at all"
      lead={`We'll check again next week. Here's something you can send ${reminder.visitorName.split(" ")[0]} in the meantime — copy it, change it, make it sound like you.`}
    >
      <div className="mt-6 grid gap-5 md:grid-cols-[minmax(0,1fr)_17rem]">
        <section className="rounded-2xl border border-border bg-white p-4">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
            Worth remembering
          </h2>
          <ul className="mt-2 space-y-3">
            {INVITE_TIPS.map((tip) => (
              <li key={tip.title}>
                <p className="text-sm font-bold text-foreground">{tip.title}</p>
                <p className="text-sm leading-relaxed text-muted">{tip.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <MessagePicker
          person={{ name: reminder.visitorName, company: reminder.visitorCompany }}
          me={reminder.memberName}
          facts={facts}
          category={visitor?.category}
        />
      </div>

      {reminder.stillOwned ? (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ReminderAction token={token} kind="invited" />
          <p className="text-sm text-muted">
            If you&rsquo;ve just sent it, say so here rather than waiting for
            next week&rsquo;s email.
          </p>
        </div>
      ) : null}

      <section className="mt-6 rounded-2xl border border-border bg-surface-muted p-4">
        {reminder.stillOwned ? (
          <>
            <h2 className="text-sm font-bold text-foreground">
              Would somebody else have better luck?
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              No shame in it &mdash; handing them back puts them in front of the
              whole chapter instead of sitting on your list. Everything written
              about them so far stays on their page.
            </p>
            <div className="mt-3">
              <ReminderAction token={token} kind="release" />
            </div>
          </>
        ) : (
          // Releasing re-renders this page, so the button's own confirmation
          // would disappear along with the branch that holds it. This is it.
          <>
            <h2 className="text-sm font-bold text-foreground">
              {reminder.visitorName} is back with the chapter
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Anyone can pick them up now, and everything written about them so
              far is still on their page. Nothing more for you to do.
            </p>
          </>
        )}
      </section>
    </ReminderShell>
  );
}
