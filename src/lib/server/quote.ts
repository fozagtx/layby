import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Currency } from "@/lib/shared";

/** How long a quoted rate is honoured, measured against the transaction's block time. */
export const QUOTE_TTL_MS = 10 * 60_000;

const secret = process.env.QUOTE_SECRET ?? process.env.DATABASE_URL ?? "";

interface QuotePayload {
  c: Currency;
  r: number; // plan currency per 1 NIM
  e: number; // expiry, ms since epoch
}

function sign(body: string) {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function issueQuote(currency: Currency, rate: number) {
  const payload: QuotePayload = { c: currency, r: rate, e: Date.now() + QUOTE_TTL_MS };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { token: `${body}.${sign(body)}`, expiresAt: payload.e };
}

/** Returns the locked rate if the token is authentic, for this currency, and the tx landed before expiry. */
export function readQuote(token: string | undefined, currency: Currency, txTimestamp: number): number | null {
  if (!token || !secret) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as QuotePayload;
    if (p.c !== currency || !(p.r > 0) || txTimestamp > p.e) return null;
    return p.r;
  } catch {
    return null;
  }
}
