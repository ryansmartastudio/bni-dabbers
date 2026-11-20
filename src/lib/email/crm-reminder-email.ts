import type { ChapterSettings } from "@/db/schema";
import { EMAIL_BRAND } from "@/lib/email/brand";
import { renderEmailLayout } from "@/lib/email/layout";

type Settings = Pick<
  ChapterSettings,
  "chapterName" | "chapterLogoUrl" | "websiteUrl" | "meetingDay" | "venueName"
>;

type ReminderEmailInput = {
  settings: Settings;
  memberFirstName: string;
  visitorName: string;
  visitorCompany: string | null;
  /** 1-4, so the last one can say it is the last one. */
  attempt: number;
  maxAttempts: number;
  yesUrl: string;
  noUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Two buttons side by side, which renderEmailButton does not do. */
function renderChoice(yesUrl: string, noUrl: string) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0;">
    <tr>
      <td bgcolor="${EMAIL_BRAND.bniRed}" style="border-radius:8px;background-color:${EMAIL_BRAND.bniRed};border:1px solid ${EMAIL_BRAND.bniRedDark};">
        <a href="${escapeHtml(yesUrl)}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Yes, I&rsquo;ve invited them</a>
      </td>
      <td style="width:12px;font-size:0;line-height:0;">&nbsp;</td>
      <td bgcolor="${EMAIL_BRAND.surfaceElevated}" style="border-radius:8px;background-color:${EMAIL_BRAND.surfaceElevated};border:1px solid ${EMAIL_BRAND.border};">
        <a href="${escapeHtml(noUrl)}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:600;color:${EMAIL_BRAND.textPrimary};text-decoration:none;">Not yet</a>
      </td>
    </tr>
  </table>`;
}

/**
 * The weekly nudge.
 *
 * Deliberately short and answerable in one tap from a phone in a car park,
 * because that is where it will be read. "Not yet" is as easy to press as
 * "yes": a nudge that only accepts good news teaches people to ignore it.
 */
export function buildCrmReminderEmail({
  settings,
  memberFirstName,
  visitorName,
  visitorCompany,
  attempt,
  maxAttempts,
  yesUrl,
  noUrl,
}: ReminderEmailInput) {
  const who = visitorCompany
    ? `${visitorName} at ${visitorCompany}`
    : visitorName;
  const last = attempt >= maxAttempts;

  const subject = `Have you invited ${visitorName} yet?`;

  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.2;font-weight:700;color:${EMAIL_BRAND.textPrimary};">Have you invited ${escapeHtml(visitorName)} yet?</h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${EMAIL_BRAND.textSecondary};">
      Hi ${escapeHtml(memberFirstName)},
    </p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${EMAIL_BRAND.textSecondary};">
      You said you&rsquo;d invite <strong style="color:${EMAIL_BRAND.textPrimary};">${escapeHtml(who)}</strong> to ${escapeHtml(settings.chapterName)}. One tap either way and the chapter knows where it stands.
    </p>
    ${renderChoice(yesUrl, noUrl)}
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.textSecondary};">
      ${
        last
          ? "That's the last reminder for this one. If you'd rather somebody else had a go, press Not yet and you can hand them back to the chapter."
          : "No rush if it's in hand &mdash; press Not yet and we'll check again next week. If you'd rather somebody else had a go, that page lets you hand them back."
      }
    </p>`;

  const text = [
    `Hi ${memberFirstName},`,
    "",
    `You said you'd invite ${who} to ${settings.chapterName}.`,
    "",
    `Yes, I've invited them: ${yesUrl}`,
    `Not yet: ${noUrl}`,
    "",
    last
      ? "That's the last reminder for this one. The Not yet page lets you hand them back to the chapter."
      : "Press Not yet and we'll check again next week. That page also lets you hand them back to the chapter.",
    "",
    `${settings.chapterName} · ${settings.meetingDay}s · ${settings.venueName}`,
  ].join("\n");

  return {
    subject,
    text,
    html: renderEmailLayout({
      settings,
      title: subject,
      bodyHtml,
      preheader: `One tap either way on ${visitorName}.`,
    }),
  };
}
