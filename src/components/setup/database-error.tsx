type DatabaseSetupErrorProps = {
  message: string;
};

export function DatabaseSetupError({ message }: DatabaseSetupErrorProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="rounded-xl border border-bni/20 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-bni">
          Setup required
        </p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">
          Database not configured
        </h1>
        <p className="mt-4 text-sm text-muted">{message}</p>
        <div className="mt-6 rounded-lg bg-surface-muted p-4 text-sm text-foreground">
          <p className="font-medium">In Vercel → Settings → Environment Variables:</p>
          <p className="mt-2 font-mono text-xs break-all">
            DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
          </p>
          <p className="mt-3 text-muted">
            Copy the full pooled connection string from Neon — not just the hostname.
          </p>
        </div>
      </div>
    </div>
  );
}
