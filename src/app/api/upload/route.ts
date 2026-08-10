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

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const { userId, sessionClaims } = await auth();
        const role = getRoleFromClaims(sessionClaims as Record<string, unknown>);

        if (!userId) {
          throw new Error("You must be signed in to upload files.");
        }
        if (role !== "admin") {
          throw new Error("Admin access is required to upload files.");
        }

        if (!isUploadFolder(clientPayload)) {
          throw new Error("Invalid upload folder.");
        }

        if (!pathname.startsWith(`${clientPayload}/`)) {
          throw new Error("Invalid upload path.");
        }

        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          throw new Error(
            "File uploads are not configured. Add BLOB_READ_WRITE_TOKEN to your environment.",
          );
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    );
  }
}
