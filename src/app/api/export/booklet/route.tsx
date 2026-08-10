import { auth } from "@clerk/nextjs/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { getBookletData } from "@/lib/settings";
import { generateQrDataUrl } from "@/lib/qr";
import { BookletDocument } from "@/pdf/booklet/document";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const preview = new URL(request.url).searchParams.get("preview") === "1";
  const { settings, links, members } = await getBookletData();

  const [membersWithQr, charityLinksWithQr, feedbackQrDataUrl] =
    await Promise.all([
      Promise.all(
        members.map(async (member) => ({
          ...member,
          qrDataUrl: member.linkedinUrl
            ? await generateQrDataUrl(member.linkedinUrl, 120)
            : undefined,
        })),
      ),
      Promise.all(
        links.map(async (link) => ({
          ...link,
          qrDataUrl: await generateQrDataUrl(link.url, 160),
        })),
      ),
      settings.feedbackQrUrl
        ? generateQrDataUrl(settings.feedbackQrUrl, 120)
        : Promise.resolve(undefined),
    ]);

  const buffer = await renderToBuffer(
    <BookletDocument
      settings={settings}
      members={membersWithQr}
      charityLinks={charityLinksWithQr}
      feedbackQrDataUrl={feedbackQrDataUrl}
    />,
  );

  const filename = `${settings.chapterName.replace(/\s+/g, "-")}-meeting-sheet.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": preview
        ? `inline; filename="${filename}"`
        : `attachment; filename="${filename}"`,
    },
  });
}
