import type { ChapterSettings, Member } from "@/db/schema";
import { EMAIL_BRAND } from "@/lib/email/brand";
import { renderEmailButton, renderEmailLayout } from "@/lib/email/layout";

type Settings = Pick<
  ChapterSettings,
  "chapterName" | "chapterLogoUrl" | "websiteUrl" | "meetingDay" | "venueName"
>;

type Input = {
  settings: Settings;
  member: Pick<Member, "firstName" | "email">;
  /** The address on the account that was linked, which may not be theirs. */
  signedInWith: string;
  pipelineUrl: string;
  when: Date;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stamp(when: Date) {
  return when.toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Sent once, the first time a member's record is attached to a sign-in.
 *
 * This is a tripwire, not a lock. Member email addresses are published on the
 * chapter directory, and several of them are shared business inboxes, so the
 * only thing standing between an address and the visitor pipeline -- other
 * people's names, numbers and emails -- is control of the mailbox. Anyone who
 * reads that mailbox and did not do this should see it happen.
 */
export function buildMemberLinkedEmail({
  settings,
  member,
  signedInWith,
  pipelineUrl,
  when,
}: Input) {
  const subject = `Your ${settings.chapterName} account is set up`;
  const differentAddress =
    signedInWith.toLowerCase() !== member.email.trim().toLowerCase();

  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.2;font-weight:700;color:${EMAIL_BRAND.textPrimary};">You're in</h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${EMAIL_BRAND.textSecondary};">
      Hi ${escapeHtml(member.firstName)},
    </p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${EMAIL_BRAND.textSecondary};">
      Your member record was linked to a ${escapeHtml(settings.chapterName)} sign-in on ${escapeHtml(stamp(when))}${
        differentAddress ? `, using <strong style="color:${EMAIL_BRAND.textPrimary};">${escapeHtml(signedInWith)}</strong>` : ""
      }. You can now see the visitor pipeline: everyone the chapter could invite, who is on each one and what has been said about them.
    </p>
    ${renderEmailButton(pipelineUrl, "Open the pipeline")}
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.textSecondary};">
      <strong style="color:${EMAIL_BRAND.textPrimary};">If this wasn't you</strong>, say so straight away &mdash; just reply to this email. The pipeline holds visitors' phone numbers and email addresses, so an account that shouldn't exist matters.
    </p>`;

  const text = [
    `Hi ${member.firstName},`,
    "",
    `Your member record was linked to a ${settings.chapterName} sign-in on ${stamp(when)}${
      differentAddress ? `, using ${signedInWith}` : ""
    }.`,
    "",
    `Open the pipeline: ${pipelineUrl}`,
    "",
    "If this wasn't you, reply to this email straight away. The pipeline holds visitors' phone numbers and email addresses.",
  ].join("\n");

  return { subject, text, html: renderEmailLayout({ settings, title: subject, bodyHtml }) };
}

/** The same fact, told to whoever looks after the chapter. */
export function buildMemberLinkedAdminNotice({
  member,
  signedInWith,
  when,
  settings,
}: Omit<Input, "pipelineUrl"> & { member: Pick<Member, "firstName" | "email"> }) {
  const subject = `${settings.chapterName}: ${member.firstName} now has pipeline access`;
  const line = `${member.firstName} (${member.email}) was linked to a sign-in on ${stamp(when)} using ${signedInWith}.`;

  return {
    subject,
    text: `${line}\n\nIf that looks wrong, remove the Clerk user and clear clerk_user_id on their member row.`,
    html: `<p>${escapeHtml(line)}</p><p>If that looks wrong, remove the Clerk user and clear <code>clerk_user_id</code> on their member row.</p>`,
  };
}
