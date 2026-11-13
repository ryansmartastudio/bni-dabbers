import { timingSafeEqual } from "node:crypto";

/**
 * Admin access is a secret path segment, not Clerk: Harry and Matt run the
 * session from their own phones and have no accounts on this app.
 *
 * Every server action re-checks the secret. Actions are POST endpoints that
 * anyone can call, so guarding only the page would guard nothing.
 */
export function getAdminSecret(): string | null {
  const secret = process.env.WORKSHOP_ADMIN_SECRET?.trim();
  return secret && secret.length >= 16 ? secret : null;
}

export function isValidAdminSecret(candidate: string | undefined | null): boolean {
  const expected = getAdminSecret();
  if (!expected || !candidate) return false;

  const given = Buffer.from(candidate);
  const want = Buffer.from(expected);
  // timingSafeEqual throws on a length mismatch, and the length itself is not
  // worth protecting here.
  if (given.length !== want.length) return false;
  return timingSafeEqual(given, want);
}

export class AdminDenied extends Error {
  constructor() {
    super("Not authorised");
    this.name = "AdminDenied";
  }
}

export function requireAdminSecret(candidate: string): void {
  if (!isValidAdminSecret(candidate)) throw new AdminDenied();
}
