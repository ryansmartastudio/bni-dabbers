import { renderToBuffer } from "@react-pdf/renderer";
import { getWorkshopJoinUrl } from "@/lib/workshop";
import { generateQrDataUrl } from "@/lib/qr";
import { isValidAdminSecret } from "@/lib/workshop/admin";
import { getChapterSettings } from "@/lib/workshop/settings";
import "@/pdf/fonts";
import { WorkshopPoster } from "@/pdf/workshop-poster";

export const dynamic = "force-dynamic";

/** A4 poster for the front of the room, generated so the URL is never stale. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ secret: string }> },
) {
  const { secret } = await params;
  if (!isValidAdminSecret(secret)) {
    return new Response("Not found", { status: 404 });
  }

  const joinUrl = getWorkshopJoinUrl();
  const [settings, qrDataUrl] = await Promise.all([
    getChapterSettings(),
    generateQrDataUrl(joinUrl, 900),
  ]);

  const buffer = await renderToBuffer(
    <WorkshopPoster
      joinUrl={joinUrl}
      chapterLogoUrl={settings.chapterLogoUrl}
      qrDataUrl={qrDataUrl}
    />,
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": 'inline; filename="dabbers-workshop-qr-poster.pdf"',
      "cache-control": "no-store",
    },
  });
}
