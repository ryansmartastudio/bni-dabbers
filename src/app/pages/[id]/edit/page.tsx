import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getPageById } from "@/lib/pages";
import { PageForm } from "@/components/pages/page-form";

export const dynamic = "force-dynamic";

type EditPageProps = PageProps<"/pages/[id]/edit">;

export default async function EditPageAdminPage({ params }: EditPageProps) {
  await requireAdmin();
  const { id } = await params;
  const page = await getPageById(id);

  if (!page) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Edit page</h1>
        <p className="mt-2 text-sm text-muted">{page.title}</p>
      </div>
      <PageForm page={page} />
    </div>
  );
}
