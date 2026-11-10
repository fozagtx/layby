import "server-only";
import { memoFor, normalizeAddress, type Network } from "@/lib/shared";

const RPC: Record<Network, string> = {
  mainnet: process.env.NIMIQ_RPC_MAINNET ?? "https://rpc.nimiqwatch.com",
  testnet: process.env.NIMIQ_RPC_TESTNET ?? "https://rpc.testnet.nimiqwatch.com",
};

export interface RpcTransaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  confirmations: number;
  from: string;
  to: string;
  value: number;
  recipientData: string;
  executionResult: boolean;
}

export class RpcError extends Error {}

async function call<T>(network: Network, method: string, params: unknown[]): Promise<T> {
  const res = await fetch(RPC[network], {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new RpcError(`RPC HTTP ${res.status}`);
  const body = await res.json();
  if (body.error) {
    const detail = typeof body.error === "string" ? body.error : (body.error.data ?? body.error.message);
    throw new RpcError(String(detail));
  }
  return body.result.data as T;
}

/** Returns null when the chain does not know the hash yet (still pending or never sent). */
export async function getTransaction(network: Network, hash: string): Promise<RpcTransaction | null> {
  try {
    return await call<RpcTransaction>(network, "getTransactionByHash", [hash]);
  } catch (e) {
    if (e instanceof RpcError && /not found/i.test(e.message)) return null;
    throw e;
  }
}

export async function getRecentTransactions(network: Network, address: string, max = 50) {
  return call<RpcTransaction[]>(network, "getTransactionsByAddress", [address, max, null]);
}

export function decodeData(hex: string) {
  if (!hex || hex.length % 2 !== 0) return "";
  try {
    return Buffer.from(hex, "hex").toString("utf8");
  } catch {
    return "";
  }
}

export type CheckResult =
  | { ok: true }
  | { ok: false; reason: "wrong_recipient" | "wrong_memo" | "failed_execution" | "zero_value" };

/** The rules a transaction must pass before it counts toward a plan. */
export function checkTransaction(tx: RpcTransaction, planId: string, merchantAddress: string): CheckResult {
  if (normalizeAddress(tx.to) !== normalizeAddress(merchantAddress)) return { ok: false, reason: "wrong_recipient" };
  if (decodeData(tx.recipientData).trim() !== memoFor(planId)) return { ok: false, reason: "wrong_memo" };
  if (!tx.executionResult) return { ok: false, reason: "failed_execution" };
  if (!(tx.value > 0)) return { ok: false, reason: "zero_value" };
  return { ok: true };
}
