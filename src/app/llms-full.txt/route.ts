import { NextResponse } from "next/server";
import { renderLlmsFullTxt } from "@/lib/ai/llms-txt";
import { getActiveMembers } from "@/lib/members";
import { listPublishedLocationPages, listPublishedPages } from "@/lib/pages";
import { getChapterSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const [settings, locationPages, pages, members] = await Promise.all([
    getChapterSettings(),
    listPublishedLocationPages(),
    listPublishedPages(),
    getActiveMembers(),
  ]);

  const body = renderLlmsFullTxt({
    settings,
    locationPages,
    pages,
    memberCount: members.length,
  });

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
