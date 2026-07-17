import crypto from "crypto";

/** Generates a URL-safe, high-entropy random token. */
export function generateRawToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/** Deterministic hash for storing/looking up random tokens safely in the DB. */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
