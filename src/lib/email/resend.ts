import { Resend } from "resend";

let resendInstance: Resend | undefined;

function getResendClient() {
  if (resendInstance) return resendInstance;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not configured. Add it to .env.local and Vercel.",
    );
  }

  resendInstance = new Resend(apiKey);
  return resendInstance;
}

export function getResendFromEmail() {
  return (
    process.env.RESEND_FROM_EMAIL ?? "BNI Dabbers <noreply@bnidabbers.co.uk>"
  );
}

export function getResendReplyTo() {
  return process.env.RESEND_REPLY_TO ?? "ryan@smartastudio.com";
}

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  const resend = getResendClient();

  const { data, error } = await resend.emails.send({
    from: getResendFromEmail(),
    replyTo: getResendReplyTo(),
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
