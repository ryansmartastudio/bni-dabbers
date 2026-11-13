/**
 * Visitor workshop — an interactive session app that piggybacks on this
 * Next.js app but is served from its own subdomain and kept out of search.
 *
 * Routing: `proxy.ts` rewrites every request on the workshop host onto the
 * `/workshop` segment, so `visitorworkshop.bnidabbers.co.uk/step-2` renders
 * `/workshop/step-2`. The same pages stay reachable at `bnidabbers.co.uk/workshop`
 * as a fallback if DNS misbehaves on the day — both are noindexed.
 */

export const WORKSHOP_PATH_PREFIX = "/workshop";

/** Host the workshop is served from. Override per environment if needed. */
export const WORKSHOP_HOST =
  process.env.NEXT_PUBLIC_WORKSHOP_HOST ?? "visitorworkshop.bnidabbers.co.uk";

export const WORKSHOP_NOINDEX =
  "noindex, nofollow, noarchive, noimageindex, nosnippet";

/** Strips the port and normalises case so host comparisons are reliable. */
export function normaliseHost(host: string | null | undefined): string {
  if (!host) return "";
  const [name] = host.trim().toLowerCase().split(":");
  return name ?? "";
}

export function isWorkshopHost(host: string | null | undefined): boolean {
  const normalised = normaliseHost(host);
  return normalised !== "" && normalised === normaliseHost(WORKSHOP_HOST);
}

export function isWorkshopPath(pathname: string): boolean {
  return (
    pathname === WORKSHOP_PATH_PREFIX ||
    pathname.startsWith(`${WORKSHOP_PATH_PREFIX}/`)
  );
}

/** Maps a path on the workshop host onto its `/workshop` route. */
export function toWorkshopPath(pathname: string): string {
  if (isWorkshopPath(pathname)) return pathname;
  if (pathname === "/") return WORKSHOP_PATH_PREFIX;
  return `${WORKSHOP_PATH_PREFIX}${pathname}`;
}
