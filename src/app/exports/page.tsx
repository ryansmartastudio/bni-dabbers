import { requireAuth } from "@/lib/auth";
import { ExportButtons } from "@/components/exports/export-buttons";
import { getChapterSettings } from "@/lib/settings";

export default async function ExportsPage() {
  const { role } = await requireAuth();
  const settings = await getChapterSettings();
  const meetingSheetFilename = `${settings.chapterName.replace(/\s+/g, "-")}-meeting-sheet.pdf`;
  const isAdmin = role === "admin";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Exports</h1>
        <p className="text-sm text-muted">
          {isAdmin
            ? "Download the directory PDF, Excel roster or weekly meeting sheet booklet."
            : "Download the weekly meeting sheet booklet."}
        </p>
      </div>
      <ExportButtons
        meetingSheetFilename={meetingSheetFilename}
        isAdmin={isAdmin}
      />
    </div>
  );
}
