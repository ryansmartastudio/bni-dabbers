import Link from "next/link";

/**
 * Workshop footer. Deliberately quiet — a single line of chapter context and a
 * light-touch build credit, so it never competes with the session itself.
 */
export function WorkshopFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface-muted/50">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>BNI Dabbers · Cheshire East</p>
        <p>
          Made real by{" "}
          <Link
            href="https://www.smartastudio.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground underline decoration-bni/40 underline-offset-4 transition hover:decoration-bni"
          >
            Smartastudio
          </Link>{" "}
          — sorry, the web design seat is taken.
        </p>
      </div>
    </footer>
  );
}
