"use client";

import QRCode from "react-qr-code";

type LinkedInQrProps = {
  url: string;
  size?: number;
};

export function LinkedInQr({ url, size = 96 }: LinkedInQrProps) {
  if (!url) {
    return (
      <div
        className="flex items-center justify-center rounded-md border border-dashed border-border bg-surface-muted text-xs text-muted"
        style={{ width: size, height: size }}
      >
        No URL
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-white p-2">
      <QRCode value={url} size={size} fgColor="#111111" bgColor="#ffffff" />
    </div>
  );
}
