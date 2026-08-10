"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const BOOKLET_PREVIEW_URL = "/api/export/booklet?preview=1";
const BOOKLET_DOWNLOAD_URL = "/api/export/booklet";

type MeetingSheetPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  downloadFilename: string;
};

export function MeetingSheetPreviewModal({
  open,
  onClose,
  downloadFilename,
}: MeetingSheetPreviewModalProps) {
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setShareStatus(null);
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const fetchPdfBlob = useCallback(async () => {
    const response = await fetch(BOOKLET_DOWNLOAD_URL);
    if (!response.ok) {
      throw new Error("Could not generate the meeting sheet.");
    }
    return response.blob();
  }, []);

  async function handleDownload() {
    setShareStatus(null);
    try {
      const blob = await fetchPdfBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadFilename;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setShareStatus("Download failed. Please try again.");
    }
  }

  async function handleShare() {
    setShareStatus(null);
    try {
      const blob = await fetchPdfBlob();
      const file = new File([blob], downloadFilename, { type: "application/pdf" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "BNI Dabbers meeting sheet",
          text: "Weekly meeting sheet booklet",
        });
        return;
      }

      await handleDownload();
      setShareStatus("Sharing is not supported here — the PDF was downloaded instead.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setShareStatus("Share failed. Try downloading the PDF instead.");
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-xl bg-white shadow-2xl sm:h-[88vh] sm:rounded-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="meeting-sheet-preview-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3 sm:px-5">
          <div>
            <h2
              id="meeting-sheet-preview-title"
              className="text-base font-semibold text-foreground"
            >
              Meeting sheet preview
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Review the latest booklet before downloading or sharing.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-muted transition hover:bg-surface-muted hover:text-foreground"
            aria-label="Close preview"
          >
            Close
          </button>
        </div>

        <div className="relative min-h-0 flex-1 bg-surface-muted">
          <iframe
            title="Meeting sheet PDF preview"
            src={BOOKLET_PREVIEW_URL}
            className="h-full w-full border-0 bg-white"
          />
        </div>

        <div className="border-t border-border px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {shareStatus ? (
              <p className="text-sm text-muted">{shareStatus}</p>
            ) : (
              <p className="text-sm text-muted">
                Updates from settings appear here on refresh.
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" onClick={handleShare}>
                Share
              </Button>
              <Button onClick={handleDownload}>Download PDF</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
