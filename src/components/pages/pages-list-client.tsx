"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Page } from "@/db/schema";
import { deletePage, setPagePublished } from "@/actions/pages";
import { getPagePublicPath } from "@/lib/pages";

type PagesListClientProps = {
  pages: Page[];
};

export function PagesListClient({ pages }: PagesListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function togglePublished(page: Page) {
    startTransition(async () => {
      await setPagePublished(page.id, !page.published);
      router.refresh();
    });
  }

  function handleDelete(page: Page) {
    if (!window.confirm(`Delete "${page.title}"?`)) return;

    startTransition(async () => {
      await deletePage(page.id);
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-muted/40 text-xs uppercase tracking-[0.12em] text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Kind</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold">Published</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-muted">
                  No pages yet. Create your first SEO landing page.
                </td>
              </tr>
            ) : (
              pages.map((page) => (
                <tr key={page.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 font-medium text-foreground">{page.title}</td>
                  <td className="px-4 py-3 capitalize text-muted">{page.kind}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{page.slug}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => togglePublished(page)}
                      className="rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ring-border"
                    >
                      {page.published ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/pages/${page.id}/edit`}
                        className="font-medium text-bni hover:underline"
                      >
                        Edit
                      </Link>
                      {page.published ? (
                        <Link
                          href={getPagePublicPath(page)}
                          className="text-muted hover:text-foreground"
                        >
                          View
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDelete(page)}
                        className="text-muted hover:text-bni"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
