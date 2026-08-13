import type { ChapterSettings, Member } from "@/db/schema";
import { EMAIL_BRAND } from "@/lib/email/brand";
import { renderEmailButton, renderEmailLayout } from "@/lib/email/layout";
import { getMemberDisplayName } from "@/lib/members";

type MemberInviteEmailInput = {
  member: Pick<Member, "firstName" | "lastName" | "company">;
  settings: Pick<
    ChapterSettings,
    | "chapterName"
    | "chapterLogoUrl"
    | "websiteUrl"
    | "meetingDay"
    | "venueName"
  >;
  inviteUrl: string;
};

export function buildMemberInviteEmail({
  member,
  settings,
  inviteUrl,
}: MemberInviteEmailInput) {
  const displayName = getMemberDisplayName(member);
  const subject = `${settings.chapterName} — manage your member profile`;

  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:24px;line-height:1.2;font-weight:700;color:${EMAIL_BRAND.textPrimary};">You're invited to manage your profile</h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${EMAIL_BRAND.textSecondary};">
      Hi ${member.firstName},
    </p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${EMAIL_BRAND.textSecondary};">
      The ${settings.chapterName} leadership team would like you to keep your member profile up to date on our chapter directory.
    </p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${EMAIL_BRAND.textSecondary};">
      Once signed in, you can update your contact details, headshot, company story, services, ideal referral and publish your public profile when you're ready. You can also download the weekly meeting sheet whenever you need it.
    </p>
    <p style="margin:0 0 8px;font-size:16px;line-height:1.6;color:${EMAIL_BRAND.textSecondary};">
      Click the button below to accept your invitation and set up access for <strong style="color:${EMAIL_BRAND.textPrimary};">${displayName}</strong> at <strong style="color:${EMAIL_BRAND.textPrimary};">${member.company}</strong>.
    </p>
    ${renderEmailButton(inviteUrl, "Manage my profile")}
    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${EMAIL_BRAND.textSecondary};">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.6;word-break:break-all;">
      <a href="${inviteUrl}" style="color:${EMAIL_BRAND.bniRed};text-decoration:underline;">${inviteUrl}</a>
    </p>
    <p style="margin:0;font-size:16px;line-height:1.6;color:${EMAIL_BRAND.textSecondary};">
      With best wishes,<br />
      <strong style="color:${EMAIL_BRAND.textPrimary};">The ${settings.chapterName} Leadership Team</strong>
    </p>
  `;

  const html = renderEmailLayout({
    settings,
    title: subject,
    preheader: "Accept your invitation to manage your BNI Dabbers member profile.",
    bodyHtml,
  });

  const text = `You're invited to manage your profile

Hi ${member.firstName},

The ${settings.chapterName} leadership team would like you to keep your member profile up to date on our chapter directory.

Once signed in, you can update your contact details, headshot, company story, services, ideal referral and publish your public profile when you're ready. You can also download the weekly meeting sheet whenever you need it.

Accept your invitation for ${displayName} at ${member.company}:
${inviteUrl}

With best wishes,
The ${settings.chapterName} Leadership Team

${settings.chapterName} · ${settings.meetingDay}s · ${settings.venueName}
${settings.websiteUrl}`;

  return { subject, html, text };
}
