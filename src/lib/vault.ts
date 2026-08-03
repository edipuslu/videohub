import crypto from "node:crypto";

/**
 * Reversible storage for client login passwords, so Uslu Digital can look up
 * what a client's password currently is and tell them.
 *
 * This is deliberately separate from the bcrypt hash used to *verify* logins —
 * that stays one-way. This copy exists only so an admin can read it back.
 *
 * It is encrypted (AES-256-GCM) rather than stored as plain text, so a leak of
 * the database alone does not expose anyone's password: an attacker would also
 * need SESSION_SECRET / PASSWORD_VAULT_KEY from the server environment.
 *
 * Note: rotating that secret makes previously stored copies unreadable. Logins
 * keep working (those use the bcrypt hash); only the "show password" display
 * is lost, and setting a new password repairs it.
 */

const ALGORITHM = "aes-256-gcm";

/**
 * True when a write failed only because `password_vault` isn't in the database
 * yet, so callers can retry without it. Keeps the app fully working in the
 * window between deploying this code and running the migration.
 */
export function isMissingVaultColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "PGRST204" || error.code === "42703") return true;
  return (error.message ?? "").includes("password_vault");
}

/** Strips the vault field so a write can be retried against an un-migrated table. */
export function withoutVault<T extends Record<string, unknown>>(payload: T): Omit<T, "password_vault"> {
  const { password_vault: _drop, ...rest } = payload;
  return rest;
}

function key(): Buffer | null {
  const secret = process.env.PASSWORD_VAULT_KEY || process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) return null;
  // Fixed salt: the secret is already high-entropy, and we need the same key
  // back on every server instance.
  return crypto.scryptSync(secret, "videohub.password.vault", 32);
}

/** Returns an encrypted blob, or null if no key is configured. */
export function encryptSecret(plain: string): string | null {
  const k = key();
  if (!k || !plain) return null;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, k, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

/** Returns the original password, or null if it can't be read back. */
export function decryptSecret(blob: string | null | undefined): string | null {
  const k = key();
  if (!k || !blob) return null;

  const parts = blob.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return null;

  try {
    const iv = Buffer.from(parts[1], "base64url");
    const tag = Buffer.from(parts[2], "base64url");
    const data = Buffer.from(parts[3], "base64url");

    const decipher = crypto.createDecipheriv(ALGORITHM, k, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    // Wrong key (secret rotated) or tampered data.
    return null;
  }
}
