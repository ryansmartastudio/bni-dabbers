/**
 * The visitor CRM, served from its own subdomain.
 *
 * Routing mirrors the workshop's: `proxy.ts` rewrites every request on the
 * CRM host onto the `/crm` segment, so `crm.bnidabbers.co.uk/` renders
 * `/crm`. The same pages stay reachable at `www.bnidabbers.co.uk/crm`, which
 * matters for two reasons -- it is the fallback if DNS misbehaves, and
 * reminder emails already in people's inboxes point there.
 *
 * The one hard difference from the workshop: the workshop host is public by
 * construction, and this one must not be. Everything here is behind Clerk
 * except the reminder links, which carry their own single-purpose token.
 */

import { normaliseHost } from "@/lib/workshop";

export const CRM_PATH_PREFIX = "/crm";

/** Host the CRM is served from. Override per environment if needed. */
export const CRM_HOST = process.env.NEXT_PUBLIC_CRM_HOST ?? "crm.bnidabbers.co.uk";

export const CRM_NOINDEX =
  "noindex, nofollow, noarchive, noimageindex, nosnippet";

export function isCrmHost(host: string | null | undefined): boolean {
  const normalised = normaliseHost(host);
  return normalised !== "" && normalised === normaliseHost(CRM_HOST);
}

export function isCrmPath(pathname: string): boolean {
  return (
    pathname === CRM_PATH_PREFIX || pathname.startsWith(`${CRM_PATH_PREFIX}/`)
  );
}

/** Maps a path on the CRM host onto its `/crm` route. */
export function toCrmPath(pathname: string): string {
  if (isCrmPath(pathname)) return pathname;
  if (pathname === "/") return CRM_PATH_PREFIX;
  return `${CRM_PATH_PREFIX}${pathname}`;
}

/**
 * The reminder links, which must work from an email without signing in.
 *
 * Takes the path after rewriting, so one rule covers both hosts: the token
 * in the path is the credential, and everything else on the CRM is private.
 */
export function isCrmReminderPath(pathname: string): boolean {
  return pathname.startsWith(`${CRM_PATH_PREFIX}/r/`);
}
