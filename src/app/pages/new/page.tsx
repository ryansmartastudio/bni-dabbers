import { requireAdmin } from "@/lib/auth";
import { PageForm } from "@/components/pages/page-form";

export default async function NewPageAdminPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">New page</h1>
        <p className="mt-2 text-sm text-muted">
          Create a CMS-managed landing page with SEO fields, sections and FAQs.
        </p>
      </div>
      <PageForm />
    </div>
  );
}
