import Link from "next/link";

type WorkshopHeaderProps = {
  /** Short label for the session, shown beside the chapter mark. */
  eyebrow?: string;
};

/**
 * Self-contained workshop header. The main site nav is hidden on these pages
 * (see `globals.css`) so attendees stay in the session rather than wandering
 * off into the directory mid-exercise.
 */
export function WorkshopHeader({ eyebrow = "Visitor workshop" }: WorkshopHeaderProps) {
  return (
    <header className="border-b border-border bg-white">
      <div className="absolute inset-x-0 top-0 h-1 bg-bni" aria-hidden="true" />
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bni text-sm font-bold text-white">
            BNI
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-wide text-foreground">
              BNI Dabbers
            </span>
            <span className="block text-xs text-muted">{eyebrow}</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
