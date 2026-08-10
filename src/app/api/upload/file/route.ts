import { put } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getRoleFromClaims } from "@/lib/auth";
import {
  buildUploadPathname,
  isUploadFolder,
  type UploadFolder,
} from "@/lib/upload-folders";

// Vercel serverless request body limit is 4.5 MB on Hobby.
const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getBlobAccess(): "public" | "private" {
  return process.env.BLOB_DEFAULT_ACCESS === "private" ? "private" : "public";
}

export async function POST(request: Request) {
  const { userId, sessionClaims } = await auth();
  const role = getRoleFromClaims(sessionClaims as Record<string, unknown>);

  if (!userId) {
    return jsonError("You must be signed in to upload files.", 401);
  }
  if (role !== "admin") {
    return jsonError("Admin access is required to upload files.", 403);
  }

  if (
    !process.env.BLOB_READ_WRITE_TOKEN &&
    !process.env.BLOB_STORE_ID
  ) {
    return jsonError(
      "File uploads are not configured. Connect a Vercel Blob store to this project.",
      503,
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Invalid upload request.", 400);
  }

  const file = formData.get("file");
  const folder = formData.get("folder");

  if (!(file instanceof File) || file.size === 0) {
    return jsonError("No file provided.", 400);
  }

  if (typeof folder !== "string" || !isUploadFolder(folder)) {
    return jsonError("Invalid upload folder.", 400);
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return jsonError(
      "Image is too large for server upload (max 4 MB on Vercel). Try a smaller or compressed image.",
      413,
    );
  }

  const mimeType = file.type || "";
  if (!mimeType.startsWith("image/")) {
    return jsonError("Please upload an image file (PNG, JPG, or WebP).", 400);
  }

  if (!ALLOWED_CONTENT_TYPES.includes(mimeType)) {
    return jsonError("Unsupported image type. Use PNG, JPG, WebP, GIF, or SVG.", 400);
  }

  const pathname = buildUploadPathname(folder as UploadFolder, file.name);
  const access = getBlobAccess();

  try {
    const blob = await put(pathname, file, {
      access,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Blob server upload failed:", error);

    const message =
      error instanceof Error ? error.message : "Upload failed.";
    const needsPublicStore =
      access === "public" &&
      message.toLowerCase().includes("access");

    return jsonError(
      needsPublicStore
        ? "Upload failed. This app needs a Public Blob store so headshots and logos are visible on the member directory. Create a Public store in Vercel Storage and connect it to this project."
        : message.includes("token")
          ? "Upload failed. Check that your Vercel Blob store is connected and BLOB_READ_WRITE_TOKEN is set for Production."
          : `Upload failed: ${message}`,
      400,
    );
  }
}
