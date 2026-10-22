import { NextResponse } from "next/server";
import { renderLlmsTxt } from "@/lib/ai/llms-txt";
import { getActiveMembers } from "@/lib/members";
import { listPublishedLocationPages } from "@/lib/pages";
import { getChapterSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const [settings, locationPages, members] = await Promise.all([
    getChapterSettings(),
    listPublishedLocationPages(),
    getActiveMembers(),
  ]);

  const body = renderLlmsTxt({
    settings,
    locationPages,
    memberCount: members.length,
  });

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
