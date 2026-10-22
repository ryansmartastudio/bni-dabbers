import { Footer } from "@/components/marketing/footer";
import { applyChapterTokensToPage } from "@/lib/chapter-tokens";
import { listPublishedLocationPages } from "@/lib/pages";
import { getChapterSettings } from "@/lib/settings";
import { loadWithDatabaseSetupFallback } from "@/lib/db-errors";

export async function SiteFooter() {
  const result = await loadWithDatabaseSetupFallback(async () => {
    const [settings, locationPages] = await Promise.all([
      getChapterSettings(),
      listPublishedLocationPages(),
    ]);
    return { settings, locationPages };
  });

  if (!result.ok) {
    return (
      <div className="border-t border-border px-4 py-6 text-center text-xs text-muted">
        {result.setupError}
      </div>
    );
  }

  const { settings, locationPages } = result.data;
  const hydratedLocationPages = locationPages.map((page) =>
    applyChapterTokensToPage(page, settings),
  );

  return <Footer settings={settings} locationPages={hydratedLocationPages} />;
}
