import { requireAdmin } from "@/lib/auth";
import { listEnquiries } from "@/lib/enquiries";
import { DatabaseSetupError } from "@/components/setup/database-error";
import { loadWithDatabaseSetupFallback } from "@/lib/db-errors";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function EnquiriesAdminPage() {
  await requireAdmin();

  const result = await loadWithDatabaseSetupFallback(listEnquiries);

  if (!result.ok) {
    return <DatabaseSetupError message={result.setupError} />;
  }

  const enquiries = result.data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Enquiries</h1>
        <p className="mt-2 text-sm text-muted">
          Guest visit form submissions from the public website.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted/40 text-xs uppercase tracking-[0.12em] text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Message</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-muted">
                    No enquiries yet.
                  </td>
                </tr>
              ) : (
                enquiries.map((enquiry) => (
                  <tr
                    key={enquiry.id}
                    className="border-b border-border align-top last:border-b-0"
                  >
                    <td className="px-4 py-3 text-muted">
                      {formatDate(enquiry.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {enquiry.name}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`mailto:${enquiry.email}`}
                        className="text-bni hover:underline"
                      >
                        {enquiry.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {enquiry.company || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {enquiry.sourcePath}
                      {enquiry.pageSlug ? (
                        <span className="mt-1 block">{enquiry.pageSlug}</span>
                      ) : null}
                    </td>
                    <td className="max-w-md px-4 py-3 text-muted">
                      {enquiry.message}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
