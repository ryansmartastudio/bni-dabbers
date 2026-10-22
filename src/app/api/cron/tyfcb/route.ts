import { NextResponse } from "next/server";
import { ENQUIRY_TO_EMAIL } from "@/lib/constants";
import { sendEmail } from "@/lib/email/resend";
import { getChapterSettings } from "@/lib/settings";
import { isTyfcbStale } from "@/lib/tyfcb";
import { syncTyfcbFromBni } from "@/lib/tyfcb-sync";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncTyfcbFromBni();

  if (!result.success && ENQUIRY_TO_EMAIL) {
    await sendEmail({
      to: ENQUIRY_TO_EMAIL,
      subject: "BNI Dabbers TYFCB sync failed",
      text: `TYFCB cron failed: ${result.error ?? "unknown"}`,
      html: `<p>TYFCB cron failed: ${result.error ?? "unknown"}</p>`,
    }).catch(() => undefined);
    return NextResponse.json(result, { status: 500 });
  }

  const settings = await getChapterSettings();
  if (isTyfcbStale(settings.tyfcbCheckedAt) && ENQUIRY_TO_EMAIL) {
    await sendEmail({
      to: ENQUIRY_TO_EMAIL,
      subject: "BNI Dabbers TYFCB figure is stale",
      text: "TYFCB has not been checked in 45+ days. Refresh in Settings or verify the BNI API.",
      html: "<p>TYFCB has not been checked in 45+ days. Refresh in Settings or verify the BNI API.</p>",
    }).catch(() => undefined);
  }

  return NextResponse.json(result);
}
