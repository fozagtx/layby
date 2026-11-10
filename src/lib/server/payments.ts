import "server-only";
import { sql } from "./db";
import { checkTransaction, getRecentTransactions, type RpcTransaction } from "./nimiq-rpc";
import { getRate } from "./price";
import { readQuote } from "./quote";
import { LUNA_PER_NIM, type Plan } from "@/lib/shared";

/**
 * Insert a chain-verified payment. Uses the customer's locked quote when it is valid,
 * otherwise the live rate. Returns false when the hash was already counted.
 */
export async function recordPayment(plan: Plan, tx: RpcTransaction, quoteToken?: string) {
  const locked = readQuote(quoteToken, plan.currency, tx.timestamp);
  const rate = locked ?? (await getRate(plan.currency));
  const fiatValue = Math.round((tx.value / LUNA_PER_NIM) * rate * 100) / 100;
  const rows = await sql`
    INSERT INTO payments (hash, plan_id, from_address, value_luna, rate, fiat_value, block_number, paid_at, rate_source)
    VALUES (${tx.hash}, ${plan.id}, ${tx.from}, ${tx.value}, ${rate}, ${fiatValue}, ${tx.blockNumber},
            ${new Date(tx.timestamp).toISOString()}, ${locked ? "locked" : "live"})
    ON CONFLICT (hash) DO NOTHING
    RETURNING hash`;
  return rows.length > 0;
}

const lastSweep = new Map<string, number>();
const SWEEP_INTERVAL_MS = 20_000;

/**
 * Re-reads the shop's recent transactions and records any tagged payment the client
 * never reported (app closed mid-flow, lost connection). One chain read per plan per 20s.
 */
export async function sweepPlan(plan: Plan) {
  if (plan.status !== "active") return 0;
  const last = lastSweep.get(plan.id) ?? 0;
  if (Date.now() - last < SWEEP_INTERVAL_MS) return 0;
  lastSweep.set(plan.id, Date.now());

  let added = 0;
  try {
    const txs = await getRecentTransactions(plan.network, plan.merchantAddress, 50);
    for (const tx of txs) {
      if (checkTransaction(tx, plan.id, plan.merchantAddress).ok && (await recordPayment(plan, tx))) added++;
    }
  } catch (e) {
    console.warn(`sweep failed for ${plan.id}:`, e instanceof Error ? e.message : e);
  }
  return added;
}
