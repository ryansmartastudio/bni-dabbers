import { requireAdmin } from "@/lib/auth";
import { getChapterSettings, getCharityLinks } from "@/lib/settings";
import { SettingsForm } from "@/components/settings/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdmin();
  const [settings, charityLinks] = await Promise.all([
    getChapterSettings(),
    getCharityLinks(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Chapter settings</h1>
        <p className="mt-2 text-sm text-muted">
          Configure the meeting sheet booklet, charity block and chapter details.
          Changes apply the next time you generate a PDF.
        </p>
      </div>
      <SettingsForm settings={settings} charityLinks={charityLinks} />
    </div>
  );
}
