"use client";

import { put } from "@vercel/blob/client";
import {
  buildUploadPathname,
  type UploadFolder,
} from "@/lib/upload-folders";

async function getClientUploadToken(pathname: string, folder: UploadFolder) {
  const response = await fetch("/api/upload", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "blob.generate-client-token",
      payload: {
        pathname,
        clientPayload: folder,
        multipart: false,
      },
    }),
  });

  const data = (await response.json()) as {
    clientToken?: string;
    error?: string;
  };

  if (!response.ok || !data.clientToken) {
    throw new Error(
      data.error ??
        "Upload authorization failed. Check that Vercel Blob storage is connected to this project.",
    );
  }

  return data.clientToken;
}

export async function uploadImage(file: File, folder: UploadFolder) {
  const pathname = buildUploadPathname(folder, file.name);
  const clientToken = await getClientUploadToken(pathname, folder);

  const blob = await put(pathname, file, {
    access: "public",
    token: clientToken,
    contentType: file.type || undefined,
  });

  return { url: blob.url };
}
