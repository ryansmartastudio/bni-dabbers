import type { Metadata } from "next";
import { ImportView } from "@/components/crm/import-view";
import { requireChapterMember } from "@/lib/member-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Import",
  robots: { index: false, follow: false },
};

/**
 * Bulk import, open to any member.
 *
 * Adding one visitor by hand already is, and a spreadsheet of twenty is the
 * same act twenty times. Nothing here deletes or overwrites: an import only
 * ever adds, and the preview is shown before it does.
 */
export default async function CrmImportPage() {
  await requireChapterMember();
  return <ImportView />;
}
