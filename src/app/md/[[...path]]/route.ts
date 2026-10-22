import { NextResponse } from "next/server";
import { resolveMarkdownDocument } from "@/lib/ai/markdown-response";

export const dynamic = "force-dynamic";

type MarkdownRouteProps = {
  params: Promise<{ path?: string[] }>;
};

export async function GET(_request: Request, { params }: MarkdownRouteProps) {
  const { path } = await params;
  const body = await resolveMarkdownDocument(path);

  if (!body) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
