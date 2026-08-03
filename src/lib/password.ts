import bcrypt from "bcryptjs";

/**
 * Password hashing helpers. Import only from server route handlers
 * (Node.js runtime) — bcryptjs is not edge-runtime compatible, so keep
 * this out of middleware.ts.
 */

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Legacy plaintext passwords (if any were ever stored un-hashed) are
 * detected by the absence of a bcrypt prefix, so a successful plaintext
 * match can be migrated to a proper hash right after login.
 */
export function looksHashed(value: string): boolean {
  return /^\$2[aby]\$/.test(value);
}
