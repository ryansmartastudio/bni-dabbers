"use server";

import { put } from "@vercel/blob";
import { assertAdmin } from "@/lib/auth";

const ALLOWED_FOLDERS = ["headshots", "logos/chapter", "logos/charity"] as const;

type UploadFolder = (typeof ALLOWED_FOLDERS)[number];

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

async function uploadAsset(formData: FormData, folder: UploadFolder) {
  await assertAdmin();

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "File uploads are not configured. Add BLOB_READ_WRITE_TOKEN to your environment.",
    );
  }

  if (!ALLOWED_FOLDERS.includes(folder)) {
    throw new Error("Invalid upload folder");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file provided");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      "Image is too large. Please use a file under 8 MB, or resize it before uploading.",
    );
  }

  const mimeType = file.type || "";
  if (!mimeType.startsWith("image/")) {
    throw new Error("Please upload an image file (PNG, JPG, or WebP).");
  }

  try {
    const blob = await put(`${folder}/${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    return { url: blob.url };
  } catch (error) {
    console.error("Blob upload failed:", error);
    throw new Error(
      "Upload failed. Check that BLOB_READ_WRITE_TOKEN is set correctly on this environment.",
    );
  }
}

export async function uploadHeadshot(formData: FormData) {
  return uploadAsset(formData, "headshots");
}

export async function uploadChapterLogo(formData: FormData) {
  return uploadAsset(formData, "logos/chapter");
}

export async function uploadCharityLogo(formData: FormData) {
  return uploadAsset(formData, "logos/charity");
}
