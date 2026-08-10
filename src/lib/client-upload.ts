"use client";

import { upload } from "@vercel/blob/client";
import {
  buildUploadPathname,
  type UploadFolder,
} from "@/lib/upload-folders";

export async function uploadImage(file: File, folder: UploadFolder) {
  const pathname = buildUploadPathname(folder, file.name);

  const blob = await upload(pathname, file, {
    access: "public",
    handleUploadUrl: "/api/upload",
    clientPayload: folder,
    contentType: file.type || undefined,
  });

  return { url: blob.url };
}
