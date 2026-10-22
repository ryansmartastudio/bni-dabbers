import type { ChapterSettings } from "@/db/schema";
import { absoluteUrl } from "@/lib/site-url";
import { renderEmailLayout } from "@/lib/email/layout";

type EnquiryEmailInput = {
  settings: Pick<ChapterSettings, "chapterName" | "chapterLogoUrl" | "websiteUrl" | "meetingDay" | "venueName">;
  enquiry: {
    name: string;
    email: string;
    phone?: string | null;
    company?: string | null;
    message: string;
    sourcePath: string;
    pageSlug?: string | null;
  };
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderEnquiryEmail({ settings, enquiry }: EnquiryEmailInput) {
  const sourceUrl = absoluteUrl(enquiry.sourcePath);
  const subject = `Guest enquiry from ${enquiry.name} — ${settings.chapterName}`;

  const lines = [
    ["Name", enquiry.name],
    ["Email", enquiry.email],
    ["Phone", enquiry.phone || "—"],
    ["Company", enquiry.company || "—"],
    ["Source page", sourceUrl],
    enquiry.pageSlug ? ["Page slug", enquiry.pageSlug] : null,
  ].filter(Boolean) as Array<[string, string]>;

  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.2;color:#171412;">New guest enquiry</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#5c5752;">
      Someone submitted the visit form on the BNI Dabbers website.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
      ${lines
        .map(
          ([label, value]) => `
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#8a8278;width:120px;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:8px 0;font-size:14px;color:#171412;vertical-align:top;">${escapeHtml(value)}</td>
        </tr>`,
        )
        .join("")}
    </table>
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#171412;">Message</p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#5c5752;white-space:pre-wrap;">${escapeHtml(enquiry.message)}</p>
  `;

  const text = [
    "New guest enquiry",
    "",
    ...lines.map(([label, value]) => `${label}: ${value}`),
    "",
    "Message:",
    enquiry.message,
  ].join("\n");

  const html = renderEmailLayout({
    settings,
    title: subject,
    bodyHtml,
    preheader: `${enquiry.name} requested a guest visit`,
  });

  return { subject, html, text };
}

export function renderVisitorConfirmationEmail({
  settings,
  enquiry,
}: EnquiryEmailInput) {
  const subject = `We received your guest visit request — ${settings.chapterName}`;
  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#171412;">Thanks, ${escapeHtml(enquiry.name)}</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#5c5752;">
      We received your enquiry about visiting ${escapeHtml(settings.chapterName)} on a ${escapeHtml(settings.meetingDay)} morning at ${escapeHtml(settings.venueName)}.
    </p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#5c5752;">
      A chapter representative will reply shortly with guest visit details. If you need to add anything, reply to this email.
    </p>
  `;
  const text = `Thanks, ${enquiry.name}. We received your guest visit request for ${settings.chapterName}. A chapter representative will reply with details.`;
  const html = renderEmailLayout({
    settings,
    title: subject,
    bodyHtml,
    preheader: "Your guest visit request was received",
  });
  return { subject, html, text };
}
