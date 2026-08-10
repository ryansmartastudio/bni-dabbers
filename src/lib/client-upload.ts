"use client";

import type { UploadFolder } from "@/lib/upload-folders";

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;

export async function uploadImage(file: File, folder: UploadFolder) {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `Image is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please use a file under 4 MB.`,
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch("/api/upload/file", {
    method: "POST",
    credentials: "same-origin",
    body: formData,
  });

  const data = (await response.json()) as { url?: string; error?: string };

  if (!response.ok || !data.url) {
    throw new Error(data.error ?? "Upload failed.");
  }

  return { url: data.url };
}
