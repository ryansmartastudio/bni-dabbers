import { db } from "@/db";
import { chapterSettings } from "@/db/schema";

/**
 * The chapter's own branding, reused on the board and the printed poster.
 *
 * Reads the logo the chapter uploaded in admin rather than bundling a BNI mark,
 * so the asset stays theirs. Falls back cleanly if settings are unavailable.
 */
export async function getChapterSettings(): Promise<{
  chapterName: string;
  chapterLogoUrl: string | null;
}> {
  try {
    const [row] = await db
      .select({
        chapterName: chapterSettings.chapterName,
        chapterLogoUrl: chapterSettings.chapterLogoUrl,
      })
      .from(chapterSettings)
      .limit(1);

    return {
      chapterName: row?.chapterName ?? "BNI Dabbers",
      chapterLogoUrl: row?.chapterLogoUrl ?? null,
    };
  } catch {
    return { chapterName: "BNI Dabbers", chapterLogoUrl: null };
  }
}
