import { NextResponse } from "next/server";
import { getRate } from "@/lib/server/price";
import { issueQuote } from "@/lib/server/quote";
import { CURRENCIES, type Currency } from "@/lib/shared";

/** A signed, 10-minute rate quote. Sent back with the payment so the shown rate is the counted rate. */
export async function GET(req: Request) {
  const currency = new URL(req.url).searchParams.get("currency")?.toUpperCase() as Currency | undefined;
  if (!currency || !CURRENCIES.includes(currency)) {
    return NextResponse.json({ error: "unsupported_currency" }, { status: 400 });
  }
  try {
    const rate = await getRate(currency);
    const { token, expiresAt } = issueQuote(currency, rate);
    return NextResponse.json({ currency, rate, quote: token, at: new Date().toISOString(), expiresAt });
  } catch (e) {
    return NextResponse.json({ error: "price_unavailable", message: (e as Error).message }, { status: 503 });
  }
}
