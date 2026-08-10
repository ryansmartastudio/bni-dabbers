import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getRoleFromClaims } from "@/lib/auth";
import { isUploadFolder } from "@/lib/upload-folders";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

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

export async function POST(request: Request) {
  let body: HandleUploadBody;

  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return jsonError("Invalid upload request.", 400);
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    return jsonError(
      "File uploads are not configured. In Vercel, open Storage → Blob, connect a store to this project, and ensure BLOB_READ_WRITE_TOKEN is set for Production.",
      503,
    );
  }

  if (body.type === "blob.generate-client-token") {
    const { userId, sessionClaims } = await auth();
    const role = getRoleFromClaims(sessionClaims as Record<string, unknown>);

    if (!userId) {
      return jsonError("You must be signed in to upload files.", 401);
    }
    if (role !== "admin") {
      return jsonError("Admin access is required to upload files.", 403);
    }
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token: blobToken,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!isUploadFolder(clientPayload)) {
          throw new Error("Invalid upload folder.");
        }

        if (!pathname.startsWith(`${clientPayload}/`)) {
          throw new Error("Invalid upload path.");
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
          tokenPayload: clientPayload,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Blob upload route error:", error);
    return jsonError(
      error instanceof Error ? error.message : "Upload failed.",
      400,
    );
  }
}
