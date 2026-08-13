import { auth } from "@clerk/nextjs/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { getRoleFromClaims } from "@/lib/auth";
import { getActiveMembers } from "@/lib/members";
import { getChapterSettings } from "@/lib/settings";
import { generateQrDataUrl } from "@/lib/qr";
import "@/pdf/hyphenation";
import "@/pdf/fonts";
import { DirectoryDocument } from "@/pdf/directory-document";

export async function GET() {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = getRoleFromClaims(sessionClaims as Record<string, unknown>);
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [members, settings] = await Promise.all([
    getActiveMembers(),
    getChapterSettings(),
  ]);

  const membersWithQr = await Promise.all(
    members.map(async (member) => ({
      ...member,
      qrDataUrl: member.linkedinUrl
        ? await generateQrDataUrl(member.linkedinUrl, 120)
        : undefined,
    })),
  );

  const buffer = await renderToBuffer(
    <DirectoryDocument members={membersWithQr} settings={settings} />,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${settings.chapterName.replace(/\s+/g, "-")}-directory.pdf"`,
    },
  });
}
