"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MeetingSheetPreviewModal } from "@/components/exports/meeting-sheet-preview-modal";

const exportsList = [
  {
    id: "directory",
    title: "Export directory PDF",
    description: "Printable member directory with headshots and LinkedIn QR codes.",
    href: "/api/export/directory",
  },
  {
    id: "excel",
    title: "Export Excel roster",
    description: "Full member roster with all fields including notes.",
    href: "/api/export/excel",
  },
] as const;

type ExportButtonsProps = {
  meetingSheetFilename: string;
  isAdmin?: boolean;
};

function MeetingSheetPreviewBox({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group mt-4 w-full overflow-hidden rounded-lg border border-border bg-surface-muted text-left transition hover:border-bni/40 hover:shadow-sm"
    >
      <div className="border-b border-border bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-8 shrink-0 flex-col overflow-hidden rounded-sm border border-border bg-white shadow-sm">
            <div className="h-2 bg-bni/10" />
            <div className="flex flex-1 flex-col gap-1 p-1">
              <div className="h-1 w-full rounded bg-border" />
              <div className="h-1 w-[80%] rounded bg-border" />
              <div className="h-1 w-[60%] rounded bg-border" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Preview meeting sheet</p>
            <p className="text-xs text-muted">
              Cover, leadership, charity, members and guest pages
            </p>
          </div>
        </div>
      </div>
      <div className="px-4 py-2.5 text-xs font-medium text-bni transition group-hover:text-bni-dark">
        Open preview
      </div>
    </button>
  );
}

export function ExportButtons({
  meetingSheetFilename,
  isAdmin = false,
}: ExportButtonsProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <div className={`grid gap-4 ${isAdmin ? "md:grid-cols-3" : "max-w-md"}`}>
        {isAdmin
          ? exportsList.map((item) => (
              <article
                key={item.id}
                className="flex flex-col rounded-xl border border-border bg-white p-5 shadow-sm"
              >
                <h3 className="text-base font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 flex-1 text-sm text-muted">
                  {item.description}
                </p>
                <Button
                  className="mt-4 w-full"
                  onClick={() => window.open(item.href, "_blank")}
                >
                  Download
                </Button>
              </article>
            ))
          : null}

        <article className="flex flex-col rounded-xl border border-border bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">Generate meeting sheet</h3>
          <p className="mt-2 flex-1 text-sm text-muted">
            A4 booklet for the secretary to print each week.
          </p>
          <MeetingSheetPreviewBox onOpen={() => setPreviewOpen(true)} />
          <Button
            variant="secondary"
            className="mt-3 w-full"
            onClick={() => window.open("/api/export/booklet", "_blank")}
          >
            Download
          </Button>
        </article>
      </div>

      <MeetingSheetPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        downloadFilename={meetingSheetFilename}
      />
    </>
  );
}
