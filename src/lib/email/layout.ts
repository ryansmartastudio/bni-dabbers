import type { ChapterSettings } from "@/db/schema";
import { EMAIL_BRAND } from "@/lib/email/brand";

type EmailLayoutOptions = {
  settings: Pick<ChapterSettings, "chapterName" | "chapterLogoUrl" | "websiteUrl" | "meetingDay" | "venueName">;
  title: string;
  bodyHtml: string;
  preheader?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHeader(settings: EmailLayoutOptions["settings"]) {
  if (settings.chapterLogoUrl) {
    return `<img src="${escapeHtml(settings.chapterLogoUrl)}" alt="${escapeHtml(settings.chapterName)}" width="180" style="display:block;max-width:180px;max-height:56px;height:auto;border:0;" />`;
  }

  return `<p style="margin:0;font-size:22px;font-weight:700;color:${EMAIL_BRAND.bniRed};letter-spacing:-0.02em;">${escapeHtml(settings.chapterName)}</p>`;
}

export function renderEmailLayout({
  settings,
  title,
  bodyHtml,
  preheader,
}: EmailLayoutOptions) {
  const footerLine = `${settings.chapterName} · ${settings.meetingDay}s · ${settings.venueName}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL_BRAND.surface};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${EMAIL_BRAND.textPrimary};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${EMAIL_BRAND.surface};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:${EMAIL_BRAND.surfaceElevated};border:1px solid ${EMAIL_BRAND.border};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 20px;background-color:${EMAIL_BRAND.surfaceElevated};">
              ${renderHeader(settings)}
            </td>
          </tr>
          <tr>
            <td style="height:4px;background-color:${EMAIL_BRAND.bniRed};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:${EMAIL_BRAND.surfaceMuted};border-top:1px solid ${EMAIL_BRAND.border};">
              <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:${EMAIL_BRAND.textSecondary};">${escapeHtml(footerLine)}</p>
              <p style="margin:0;font-size:13px;line-height:1.5;color:${EMAIL_BRAND.textSecondary};">
                <a href="https://${escapeHtml(settings.websiteUrl.replace(/^https?:\/\//, ""))}" style="color:${EMAIL_BRAND.bniRed};text-decoration:none;">${escapeHtml(settings.websiteUrl.replace(/^https?:\/\//, ""))}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderEmailButton(href: string, label: string) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0;">
    <tr>
      <td align="center" bgcolor="${EMAIL_BRAND.bniRed}" style="border-radius:8px;background-color:${EMAIL_BRAND.bniRed};border:1px solid ${EMAIL_BRAND.bniRedDark};">
        <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}
