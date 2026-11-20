import { createHash, randomBytes } from "node:crypto";

/**
 * One-click reminder links.
 *
 * The raw token exists only in the email. What is stored is its SHA-256, so
 * a leaked database backup yields no working links -- the same reasoning as
 * storing password hashes, and the reason this is not just a uuid column.
 *
 * SHA-256 with no salt or stretching is right here and would be wrong for a
 * password: the input is 256 bits of randomness, so there is no dictionary to
 * run against it.
 */

/** Long enough to be unguessable, short enough to survive an email client. */
const TOKEN_BYTES = 32;

/** Longer than four weekly nudges, so a link never dies mid-sequence. */
export const TOKEN_TTL_DAYS = 21;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createReminderToken(now = new Date()) {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(now.getTime() + TOKEN_TTL_DAYS * 86_400_000);
  return { token, tokenHash: hashToken(token), expiresAt };
}

/**
 * Tokens arrive from a URL path, so anything that is not the shape we issue
 * is rejected before it reaches a database query.
 */
export function looksLikeToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{40,90}$/.test(value);
}
