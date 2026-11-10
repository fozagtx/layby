import { NextResponse } from "next/server";
import { getPlan, publicPlan, rowToPayment, sql } from "@/lib/server/db";
import { decodeData, getTransaction } from "@/lib/server/nimiq-rpc";
import { memoFor, normalizeAddress } from "@/lib/shared";

/**
 * A receipt re-runs the six checks against the chain on every view, so what the customer
 * sees is what the chain says now, not what we stored. Falls back to the stored record
 * (which already passed all six) if the network can't be reached.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  if (!/^[0-9a-f]{64}$/i.test(hash)) return NextResponse.json({ error: "invalid_hash" }, { status: 400 });

  const rows = await sql`SELECT * FROM payments WHERE hash = ${hash.toLowerCase()}`;
  if (!rows[0]) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const payment = rowToPayment(rows[0]);
  const found = await getPlan(rows[0].plan_id as string);
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const plan = publicPlan(found);

  let source: "live" | "stored" = "stored";
  let checks = {
    found: true,
    recipient: true,
    memo: true,
    executed: true,
    amount: true,
    unique: true,
  };
  let memo = memoFor(plan.id);
  try {
    const tx = await getTransaction(plan.network, payment.hash);
    source = "live";
    memo = tx ? decodeData(tx.recipientData) : "";
    checks = {
      found: Boolean(tx),
      recipient: Boolean(tx) && normalizeAddress(tx!.to) === normalizeAddress(plan.merchantAddress),
      memo: memo.trim() === memoFor(plan.id),
      executed: Boolean(tx?.executionResult),
      amount: Boolean(tx) && tx!.value === payment.valueLuna && tx!.value > 0,
      unique: true, // the hash is the primary key: it can only ever be counted once
    };
  } catch {
    /* network unreachable: show the stored, already-verified record */
  }

  return NextResponse.json({ plan, payment, checks, memo, source, checkedAt: new Date().toISOString() });
}
