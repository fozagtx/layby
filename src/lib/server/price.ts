import "server-only";
import type { Currency } from "@/lib/shared";

const cache = new Map<string, { rate: number; at: number }>();
const TTL_MS = 60_000;

/** Price of 1 NIM in the given currency. NIM-priced plans use a rate of 1. */
export async function getRate(currency: Currency): Promise<number> {
  if (currency === "NIM") return 1;
  const key = currency.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.rate;

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=nimiq-2&vs_currencies=${key}`,
    { cache: "no-store", signal: AbortSignal.timeout(8_000) },
  );
  if (!res.ok) {
    if (hit) return hit.rate; // a slightly stale rate beats failing the payment check
    throw new Error(`Price lookup failed (${res.status})`);
  }
  const body = await res.json();
  const rate = Number(body?.["nimiq-2"]?.[key]);
  if (!(rate > 0)) throw new Error(`No NIM price for ${currency}`);
  cache.set(key, { rate, at: Date.now() });
  return rate;
}
