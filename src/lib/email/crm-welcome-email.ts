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
  crmUrl: string;
  /** Where somebody with no account yet should start. */
  signUpUrl: string;
  toolkitUrl: string;
  /** How many people are sitting in the pipeline waiting for somebody. */
  unclaimedCount: number;
  totalCount: number;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * The email that tells a member the CRM exists and how to get in.
 *
 * Built as a template rather than a one-off because it goes to one person
 * first as a test and then to the rest of the chapter, and those two have to
 * be the same email or the test proves nothing.
 *
 * The address matters more than anything else here. Access is not an invite
 * link or a password: the chapter's own member list IS the allowlist, matched
 * against a Clerk-verified address. Sign up with a personal Gmail and you get
 * a "we don't recognise you" screen with no obvious way forward. So the
 * address this was sent to is stated plainly, twice, and in the subject's
 * preheader.
 */
export function buildCrmWelcomeEmail({
  settings,
  member,
  crmUrl,
  signUpUrl,
  toolkitUrl,
  unclaimedCount,
  totalCount,
}: Input) {
  const subject = `${settings.chapterName}: the visitor pipeline is ready for you`;
  const address = member.email.trim();
  const host = crmUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const preheader = `Set your password, using ${address}. ${unclaimedCount} visitors still need somebody.`;

  // Today every one of the 107 is unclaimed, and "107 people, of whom 107"
  // reads like a mail merge that has gone wrong. It will not always be all
  // of them, so both forms have to be right.
  const unclaimedPhrase =
    unclaimedCount === totalCount
      ? "not one of them has anybody down to invite them yet"
      : `<strong style="color:${EMAIL_BRAND.textPrimary};">${unclaimedCount}</strong> of them still have nobody down to invite them`;
  const unclaimedPhraseText =
    unclaimedCount === totalCount
      ? "not one of them has anybody down to invite them yet"
      : `${unclaimedCount} of them still have nobody down to invite them`;

  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.2;font-weight:700;color:${EMAIL_BRAND.textPrimary};">Your visitor pipeline</h1>

    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${EMAIL_BRAND.textSecondary};">
      Hi ${escapeHtml(member.firstName)},
    </p>

    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${EMAIL_BRAND.textSecondary};">
      Everyone the room came up with at the Growth Workshop is now in one place, and it is open to you.
      <strong style="color:${EMAIL_BRAND.textPrimary};">${totalCount} people</strong>, and ${unclaimedPhrase}.
    </p>

    <p style="margin:0 0 8px;font-size:16px;line-height:1.6;color:${EMAIL_BRAND.textSecondary};">You can:</p>
    <ul style="margin:0 0 20px;padding-left:20px;font-size:16px;line-height:1.7;color:${EMAIL_BRAND.textSecondary};">
      <li>See every visitor on a map of the open seats, or as a board you can drag people across.</li>
      <li>Put your name against anyone you are happy to invite, so two of us never ring the same person.</li>
      <li>Copy a message that is already written and filled in, for WhatsApp, LinkedIn or email.</li>
      <li>Add somebody who never came up at the workshop, or bring a whole list in from a spreadsheet.</li>
    </ul>

    ${renderEmailButton(signUpUrl, "Set up your sign-in")}

    <p style="margin:-12px 0 24px;font-size:14px;line-height:1.6;color:${EMAIL_BRAND.textSecondary};">
      Already set one up? <a href="${escapeHtml(crmUrl)}" style="color:${EMAIL_BRAND.bniRed};text-decoration:underline;">Go straight to the pipeline</a>.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;background-color:${EMAIL_BRAND.surfaceMuted};border:1px solid ${EMAIL_BRAND.border};border-radius:12px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 8px;font-size:15px;line-height:1.6;font-weight:700;color:${EMAIL_BRAND.textPrimary};">
            You have not got a password yet, so set one
          </p>
          <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.textSecondary};">
            The button above opens the sign-up page, where you choose your own password.
            Use <strong style="color:${EMAIL_BRAND.textPrimary};">${escapeHtml(address)}</strong> as the email address:
            that is how the chapter recognises you, so another one will leave you looking at a holding page instead of the pipeline.
          </p>
          <p style="margin:0;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.textSecondary};">
            Two boxes, your email and a password you pick. Nothing to pay and no code to wait for.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.textSecondary};">
      There is also an <a href="${escapeHtml(toolkitUrl)}" style="color:${EMAIL_BRAND.bniRed};text-decoration:underline;">invite toolkit</a>
      in there: the messages, the rules behind them, and the podcasts, all in one place.
    </p>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.textSecondary};">
      It holds visitors' phone numbers and email addresses, so it is members only and it is not indexed anywhere.
      If anything looks wrong or will not let you in, reply to this email and tell me what you saw.
    </p>`;

  const text = [
    `Hi ${member.firstName},`,
    "",
    `Everyone the room came up with at the Growth Workshop is now in one place, and it is open to you. ${totalCount} people, and ${unclaimedPhraseText}.`,
    "",
    "You can:",
    "- See every visitor on a map of the open seats, or as a board you can drag people across.",
    "- Put your name against anyone you are happy to invite, so two of us never ring the same person.",
    "- Copy a message that is already written and filled in, for WhatsApp, LinkedIn or email.",
    "- Add somebody who never came up at the workshop, or bring a whole list in from a spreadsheet.",
    "",
    `Set up your sign-in: ${signUpUrl}`,
    `Already set one up? Go straight to the pipeline: ${crmUrl}`,
    "",
    "YOU HAVE NOT GOT A PASSWORD YET, SO SET ONE",
    `The first link opens the sign-up page, where you choose your own password. Use ${address} as the email address: that is how the chapter recognises you, so another one will leave you looking at a holding page instead of the pipeline.`,
    "Two boxes, your email and a password you pick. Nothing to pay and no code to wait for.",
    "",
    `There is also an invite toolkit in there, with the messages, the rules behind them and the podcasts: ${toolkitUrl}`,
    "",
    `It holds visitors' phone numbers and email addresses, so it is members only and it is not indexed anywhere. If anything looks wrong or will not let you in, reply to this email and tell me what you saw.`,
    "",
    `${host}`,
  ].join("\n");

  return {
    subject,
    text,
    html: renderEmailLayout({ settings, title: subject, bodyHtml, preheader }),
  };
}
