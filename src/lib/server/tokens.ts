import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const ID_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function newPlanId(length = 8) {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join("");
}

/** 6-character handover code, no look-alike characters (0/O, 1/I/L). */
export function newCollectCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from(randomBytes(6), (b) => alphabet[b % alphabet.length]).join("");
}

export function newManageToken() {
  return randomBytes(24).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenMatches(token: string | undefined | null, storedHash: string) {
  if (!token) return false;
  const a = Buffer.from(hashToken(token), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
