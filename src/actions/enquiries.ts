"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { enquiries } from "@/db/schema";
import { ENQUIRY_TO_EMAIL } from "@/lib/constants";
import { countRecentEnquiriesByEmail } from "@/lib/enquiries";
import {
  renderEnquiryEmail,
  renderVisitorConfirmationEmail,
} from "@/lib/email/enquiry-email";
import { sendEmail } from "@/lib/email/resend";
import { getChapterSettings } from "@/lib/settings";
import { enquirySchema, type EnquiryFormValues } from "@/lib/validations";

type ActionResult = {
  success: boolean;
  error?: string;
};

export async function submitEnquiry(
  data: EnquiryFormValues,
): Promise<ActionResult> {
  const parsed = enquirySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid form data",
    };
  }

  if (parsed.data.website?.trim()) {
    return { success: true };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const recentCount = await countRecentEnquiriesByEmail(email);
  if (recentCount >= 3) {
    return {
      success: false,
      error: "Too many enquiries in a short time. Please try again later.",
    };
  }

  const settings = await getChapterSettings();
  const [inserted] = await db
    .insert(enquiries)
    .values({
      name: parsed.data.name.trim(),
      email,
      phone: parsed.data.phone?.trim() || null,
      company: parsed.data.company?.trim() || null,
      message: parsed.data.message.trim(),
      sourcePath: parsed.data.sourcePath,
      pageSlug: parsed.data.pageSlug?.trim() || null,
    })
    .returning();

  const { subject, html, text } = renderEnquiryEmail({
    settings,
    enquiry: {
      name: inserted.name,
      email: inserted.email,
      phone: inserted.phone,
      company: inserted.company,
      message: inserted.message,
      sourcePath: inserted.sourcePath,
      pageSlug: inserted.pageSlug,
    },
  });

  try {
    await sendEmail({
      to: ENQUIRY_TO_EMAIL,
      subject,
      html,
      text,
      replyTo: inserted.email,
    });

    const visitorMail = renderVisitorConfirmationEmail({
      settings,
      enquiry: {
        name: inserted.name,
        email: inserted.email,
        phone: inserted.phone,
        company: inserted.company,
        message: inserted.message,
        sourcePath: inserted.sourcePath,
        pageSlug: inserted.pageSlug,
      },
    });

    await sendEmail({
      to: inserted.email,
      subject: visitorMail.subject,
      html: visitorMail.html,
      text: visitorMail.text,
    }).catch((visitorError) => {
      console.error("Failed to send visitor confirmation email", visitorError);
    });

    await db
      .update(enquiries)
      .set({ emailedAt: new Date() })
      .where(eq(enquiries.id, inserted.id));
  } catch (error) {
    console.error("Failed to send enquiry email", error);
    return {
      success: false,
      error:
        "Your enquiry was saved but email could not be sent. Please email us directly.",
    };
  }

  return { success: true };
}
