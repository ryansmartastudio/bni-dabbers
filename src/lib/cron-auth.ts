import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Guard for the Vercel cron routes.
 *
 * Compares SHA-256 digests rather than the strings themselves, so the check
 * takes the same time whatever is sent and never leaks the secret one
 * character at a time. Digests are also always the same length, which
 * timingSafeEqual requires and raw headers do not guarantee.
 *
 * Fails closed when CRON_SECRET is unset: an unconfigured deployment refuses
 * the cron rather than running it for anybody who finds the URL.
 */
export function isAuthorisedCron(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const header = request.headers.get("authorization");
  if (!header) return false;

  const sent = createHash("sha256").update(header).digest();
  const want = createHash("sha256").update(`Bearer ${expected}`).digest();
  return timingSafeEqual(sent, want);
}
