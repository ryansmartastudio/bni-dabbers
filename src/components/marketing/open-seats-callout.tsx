import Link from "next/link";

export function OpenSeatsCallout() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
      <div className="marketing-section-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bni">
            Join the chapter
          </p>
          <p className="mt-2 text-base font-medium text-foreground">
            Looking for an open category?
          </p>
          <p className="mt-1 max-w-xl text-sm text-muted">
            BNI allows one member per profession. See which seats are open before a competitor
            locks your category.
          </p>
        </div>
        <Link href="/open-seats" className="marketing-primary-button shrink-0">
          View open seats
        </Link>
      </div>
    </section>
  );
}
