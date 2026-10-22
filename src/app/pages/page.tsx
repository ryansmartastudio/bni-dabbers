import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listAllPages } from "@/lib/pages";
import { PagesListClient } from "@/components/pages/pages-list-client";
import { DatabaseSetupError } from "@/components/setup/database-error";
import { loadWithDatabaseSetupFallback } from "@/lib/db-errors";

export const dynamic = "force-dynamic";

export default async function PagesAdminPage() {
  await requireAdmin();

  const result = await loadWithDatabaseSetupFallback(listAllPages);

  if (!result.ok) {
    return <DatabaseSetupError message={result.setupError} />;
  }

  const pages = result.data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pages</h1>
          <p className="mt-2 text-sm text-muted">
            Manage SEO landing pages, homepage copy and location guides.
          </p>
        </div>
        <Link
          href="/pages/new"
          className="inline-flex items-center justify-center rounded-md bg-bni px-5 py-3 text-sm font-semibold text-white transition hover:bg-bni-dark"
        >
          New page
        </Link>
      </div>
      <PagesListClient pages={pages} />
    </div>
  );
}
