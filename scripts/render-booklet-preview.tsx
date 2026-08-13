import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { getBookletData } from "@/lib/settings";
import { generateQrDataUrl } from "@/lib/qr";
import { BookletDocument } from "@/pdf/booklet/document";
import "@/pdf/fonts";
import "@/pdf/hyphenation";

async function main() {
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

  const outputPath = resolve(process.cwd(), "tmp-meeting-sheet-preview.pdf");
  writeFileSync(outputPath, buffer);
  console.log(`Wrote ${outputPath} (${buffer.length} bytes)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
