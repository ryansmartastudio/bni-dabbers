import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Page not found | BNI Dabbers" },
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-start justify-center px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
        404
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-foreground">
        Page not found
      </h1>
      <p className="mt-4 text-base text-muted">
        The page you requested is not available. Try the member directory or our
        networking guides.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-bni px-5 py-3 text-sm font-semibold text-white transition hover:bg-bni-dark"
        >
          Go home
        </Link>
        <Link
          href="/directory"
          className="inline-flex items-center justify-center rounded-md border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
        >
          Browse directory
        </Link>
      </div>
    </div>
  );
}
