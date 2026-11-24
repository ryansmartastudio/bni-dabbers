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
  replyTo?: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: SendEmailInput) {
  const resend = getResendClient();

  const { data, error } = await resend.emails.send({
    from: getResendFromEmail(),
    replyTo: replyTo ?? getResendReplyTo(),
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

export type BatchEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type BatchSendResult = {
  /** Index into the input array, so the caller knows who failed. */
  failures: { index: number; message: string }[];
  sent: number;
};

/**
 * Sends up to 100 personalised emails in one request.
 *
 * A loop of single sends would take the chapter-wide welcome past both
 * Resend's rate limit and the serverless function's timeout, and would leave
 * the send half-finished with no record of where it stopped.
 *
 * `batchValidation: "permissive"` is the important part: in the default
 * strict mode one bad address rejects the whole batch, so a single member
 * with a typo in their record would stop the other thirty-five getting
 * theirs. Permissive sends the rest and reports the failures by index.
 */
export async function sendEmailBatch(
  emails: BatchEmail[],
): Promise<BatchSendResult> {
  if (emails.length === 0) return { failures: [], sent: 0 };
  if (emails.length > 100) {
    throw new Error("Resend takes at most 100 emails in one batch.");
  }

  const resend = getResendClient();
  const from = getResendFromEmail();
  const replyTo = getResendReplyTo();

  const { data, error } = await resend.batch.send(
    emails.map((email) => ({
      from,
      replyTo,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    })),
    { batchValidation: "permissive" },
  );

  if (error) {
    throw new Error(error.message);
  }

  const failures = (data?.errors ?? []).map((failure) => ({
    index: failure.index,
    message: failure.message,
  }));

  return { failures, sent: emails.length - failures.length };
}
