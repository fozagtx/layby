import { test } from "node:test";
import assert from "node:assert/strict";
import { checkTransaction, decodeData, type RpcTransaction } from "../src/lib/server/nimiq-rpc";
import { computeProgress, isValidNimiqAddress, paymentsByStep, type Plan } from "../src/lib/shared";

const SHOP = "NQ16 DC0Y 529V BVC7 J48Q UVNN YQ6P QVRN T5U3";
const hex = (s: string) => Buffer.from(s, "utf8").toString("hex");

const tx = (over: Partial<RpcTransaction> = {}): RpcTransaction => ({
  hash: "ab".repeat(32),
  blockNumber: 1,
  timestamp: Date.now(),
  confirmations: 1,
  from: "NQ06 XE9G BQV1 0V1R UUXD S550 YL8N 1HK0 GK6C",
  to: SHOP,
  value: 500_000,
  recipientData: hex("layby:abc12345"),
  executionResult: true,
  ...over,
});

test("accepts a tagged, executed payment to the shop (address spacing/case ignored)", () => {
  assert.deepEqual(checkTransaction(tx({ to: SHOP.replace(/ /g, "").toLowerCase() }), "abc12345", SHOP), { ok: true });
});

test("rejects wrong recipient, wrong memo, failed execution, zero value", () => {
  assert.equal(checkTransaction(tx({ to: "NQ06 XE9G BQV1 0V1R UUXD S550 YL8N 1HK0 GK6C" }), "abc12345", SHOP).ok, false);
  assert.deepEqual(checkTransaction(tx({ recipientData: hex("layby:other123") }), "abc12345", SHOP), { ok: false, reason: "wrong_memo" });
  assert.deepEqual(checkTransaction(tx({ recipientData: hex("Walk the dog") }), "abc12345", SHOP), { ok: false, reason: "wrong_memo" });
  assert.deepEqual(checkTransaction(tx({ executionResult: false }), "abc12345", SHOP), { ok: false, reason: "failed_execution" });
  assert.deepEqual(checkTransaction(tx({ value: 0 }), "abc12345", SHOP), { ok: false, reason: "zero_value" });
});

test("decodes hex memos and tolerates junk", () => {
  assert.equal(decodeData(hex("layby:abc12345")), "layby:abc12345");
  assert.equal(decodeData("abc"), "");
  assert.equal(decodeData(""), "");
});

test("validates Nimiq address checksums", () => {
  assert.equal(isValidNimiqAddress(SHOP), true);
  assert.equal(isValidNimiqAddress("NQ17 DC0Y 529V BVC7 J48Q UVNN YQ6P QVRN T5U3"), false);
  assert.equal(isValidNimiqAddress("hello"), false);
});

const plan: Plan = {
  id: "abc12345", network: "testnet", merchantName: "Shop", merchantAddress: SHOP, shopPlace: "", hasPhoto: false,
  collectBy: null, item: "Phone", note: "",
  customerName: "", price: 1000, currency: "NGN", installments: 4, cadence: "weekly", startDate: "2026-11-01",
  policy: "", status: "active", collectedAt: null, createdAt: "2026-11-01T00:00:00Z",
};
const pay = (fiatValue: number) => ({ hash: "x", fromAddress: "", valueLuna: 1, rate: 1, fiatValue, blockNumber: 1, paidAt: "2026-11-01T00:00:00Z", rateSource: "live" as const });

test("progress: schedule, next due, overdue, fully paid", () => {
  const now = new Date("2026-11-10T12:00:00Z"); // steps due 11-01 and 11-08 have passed
  const p = computeProgress(plan, [pay(250)], now);
  assert.equal(p.percent, 25);
  assert.equal(p.schedule.length, 4);
  assert.equal(p.schedule[1].date, "2026-11-08");
  assert.equal(p.nextDue?.index, 2);
  assert.equal(p.behindBy, 250);
  assert.equal(p.fullyPaid, false);

  const done = computeProgress(plan, [pay(600), pay(400)], now);
  assert.equal(done.fullyPaid, true);
  assert.equal(done.percent, 100);
  assert.equal(done.nextDue, null);
});

test("progress: uneven split puts the remainder on the last installment", () => {
  const p = computeProgress({ ...plan, price: 100, installments: 3 }, []);
  assert.deepEqual(p.schedule.map((s) => s.amount), [33.33, 33.33, 33.34]);
});

test("paymentsByStep maps each filled brick to the payment that completed it", () => {
  const progress = computeProgress(plan, []);
  const a = { ...pay(250), hash: "a", paidAt: "2026-11-01T00:00:00Z" };
  const b = { ...pay(500), hash: "b", paidAt: "2026-11-02T00:00:00Z" };
  const map = paymentsByStep(progress.schedule, [b, a]);
  assert.deepEqual(map.map((p) => p?.hash ?? null), ["a", "b", "b", null]);
});

test("signed quotes: locked rate honoured until expiry, rejected when tampered or for another currency", async () => {
  process.env.QUOTE_SECRET = "test-secret";
  const { issueQuote, readQuote } = await import("../src/lib/server/quote");
  const { token, expiresAt } = issueQuote("NGN", 0.34);
  assert.equal(readQuote(token, "NGN", Date.now()), 0.34);
  assert.equal(readQuote(token, "NGN", expiresAt + 1), null);
  assert.equal(readQuote(token, "KES", Date.now()), null);
  assert.equal(readQuote(token.slice(0, -2) + "xx", "NGN", Date.now()), null);
  assert.equal(readQuote(undefined, "NGN", Date.now()), null);
});
