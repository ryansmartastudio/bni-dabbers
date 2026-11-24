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

/**
 * Paths that must reach their real route on the CRM host, neither rewritten
 * under /crm nor protected.
 *
 * Without this the host eats its own sign-in page: /sign-in is rewritten to
 * /crm/sign-in, which needs a member, so auth.protect() sends the browser to
 * /sign-in, which is rewritten again. That is an infinite redirect, and it
 * only shows up in a browser -- Clerk answers a request that does not accept
 * HTML with a 404, so a plain curl check reports the host as healthy.
 *
 * /__clerk/ is the frontend-API proxy. The workshop branch has always let it
 * through; the CRM branch did not, which stopped Clerk establishing a session
 * on this host at all.
 */
export function isCrmAuthPassthroughPath(pathname: string): boolean {
  return (
    pathname === "/__clerk" ||
    pathname.startsWith("/__clerk/") ||
    isUnder(pathname, "/sign-in") ||
    isUnder(pathname, "/sign-up")
  );
}

/** Exact match or a child path, never a lookalike like /sign-in-now. */
function isUnder(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Member pages that live outside /crm but must still work on this host.
 *
 * /my-profile is the one that matters. requireChapterMember() sends anyone
 * it cannot match to it, which is exactly what happens when somebody signs
 * up with a personal address instead of the one the chapter holds. Rewritten
 * under /crm that is a 404, so the most likely mistake a new member can make
 * led to a dead end instead of the screen that explains it.
 *
 * Unlike the auth paths above these are NOT public: the caller still has to
 * protect them.
 */
export function isCrmMemberPassthroughPath(pathname: string): boolean {
  return isUnder(pathname, "/my-profile");
}

/**
 * CRM routes that need the admin role on top of membership.
 *
 * Matched on the path after rewriting so one rule covers both hosts. Without
 * it the subdomain would skip the middleware's admin check entirely, since
 * that check sits after the CRM branch returns.
 */
export function isCrmAdminPath(pathname: string): boolean {
  return (
    isUnder(pathname, `${CRM_PATH_PREFIX}/reports`) ||
    // Member access can email the whole chapter, so it is gated the same way
    // as the reports rather than left to the page guard alone.
    isUnder(pathname, `${CRM_PATH_PREFIX}/members`)
  );
}

/**
 * Where to send a member, for links that leave the app.
 *
 * Emails point at the subdomain now that it resolves. The main domain still
 * serves every one of these paths, so a link already in somebody's inbox
 * keeps working either way -- but a reminder should land people in the CRM
 * rather than part-way through the marketing site.
 */
export function getCrmUrl(path = "/"): string {
  const suffix = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `https://${CRM_HOST}${suffix}`;
}

/**
 * Where to send somebody who has no account yet.
 *
 * The welcome email used to point at the board. For a member who has never
 * signed in that bounces to /sign-in, which asks for a password they have
 * never set -- so the first person to try it stopped there. This opens the
 * sign-up page instead, and sends them to the board once they are through.
 *
 * The redirect is relative on purpose: same-origin, so it needs no entry in
 * Clerk's allowed-redirect list and cannot be pointed somewhere else.
 */
export function getCrmSignUpUrl(): string {
  return `${getCrmUrl("/sign-up")}?redirect_url=${encodeURIComponent("/")}`;
}
