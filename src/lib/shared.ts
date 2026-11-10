// Types and pure helpers shared by server routes and client pages.

export type Network = "mainnet" | "testnet";
export type Cadence = "weekly" | "biweekly" | "monthly";
export type PlanStatus = "active" | "collected" | "cancelled";

export const LUNA_PER_NIM = 100_000;
export const MEMO_PREFIX = "layby:";

export const CURRENCIES = [
  "NIM", "USD", "EUR", "GBP", "CHF", "NGN", "KES", "GHS", "ZAR", "XAF", "XOF",
  "UGX", "TZS", "INR", "BRL", "MXN", "TRY", "PHP", "IDR",
] as const;
export type Currency = (typeof CURRENCIES)[number];

export const POLICY_PRESETS = [
  { id: "full", label: "Full refund", text: "If you cancel before collecting, the shop refunds everything you paid." },
  { id: "minus10", label: "Refund minus 10%", text: "If you cancel before collecting, the shop refunds what you paid minus 10%." },
  { id: "credit", label: "Store credit only", text: "If you cancel, what you paid stays with the shop as store credit." },
] as const;

export interface Plan {
  id: string;
  network: Network;
  merchantName: string;
  merchantAddress: string;
  shopPlace: string;
  hasPhoto: boolean;
  collectBy: string | null; // YYYY-MM-DD
  item: string;
  note: string;
  customerName: string;
  price: number;
  currency: Currency;
  installments: number;
  cadence: Cadence;
  startDate: string; // YYYY-MM-DD
  policy: string;
  status: PlanStatus;
  collectedAt: string | null;
  createdAt: string;
}

export interface Payment {
  hash: string;
  fromAddress: string;
  valueLuna: number;
  rate: number; // plan currency per 1 NIM at the time the payment was checked
  fiatValue: number; // value in plan currency
  blockNumber: number;
  paidAt: string;
  rateSource: "locked" | "live";
}

/** For each installment, the payment (oldest first) that completed it, if any. */
export function paymentsByStep(schedule: DueStep[], payments: Payment[]) {
  const ordered = [...payments].sort((a, b) => a.paidAt.localeCompare(b.paidAt));
  let running = 0;
  let cursor = 0;
  return schedule.map((step) => {
    while (cursor < ordered.length && running + 0.005 < step.cumulative) {
      running += ordered[cursor].fiatValue;
      cursor++;
    }
    return running + 0.005 >= step.cumulative && cursor > 0 ? ordered[cursor - 1] : null;
  });
}

export function shortHash(hash: string) {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

export interface DueStep {
  index: number;
  date: string;
  amount: number;
  cumulative: number;
  covered: boolean;
}

export interface Progress {
  paid: number;
  remaining: number;
  percent: number;
  fullyPaid: boolean;
  installmentAmount: number;
  schedule: DueStep[];
  nextDue: DueStep | null;
  behindBy: number; // how much is owed for steps already due
}

export function memoFor(planId: string) {
  return `${MEMO_PREFIX}${planId}`;
}

export function normalizeAddress(address: string) {
  return address.replace(/\s+/g, "").toUpperCase();
}

export function formatAddress(address: string) {
  return normalizeAddress(address).replace(/(.{4})/g, "$1 ").trim();
}

/** Nimiq user-friendly addresses use an IBAN-style mod-97 checksum. */
export function isValidNimiqAddress(address: string) {
  const a = normalizeAddress(address);
  if (!/^NQ\d{2}[0-9A-HJ-NP-VXY]{32}$/.test(a)) return false;
  const rearranged = a.slice(4) + a.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const digits = /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
    for (const d of digits) remainder = (remainder * 10 + Number(d)) % 97;
  }
  return remainder === 1;
}

function addCadence(start: Date, cadence: Cadence, steps: number) {
  const d = new Date(start);
  if (cadence === "weekly") d.setUTCDate(d.getUTCDate() + 7 * steps);
  else if (cadence === "biweekly") d.setUTCDate(d.getUTCDate() + 14 * steps);
  else d.setUTCMonth(d.getUTCMonth() + steps);
  return d;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeProgress(plan: Plan, payments: Payment[], now = new Date()): Progress {
  const paid = round2(payments.reduce((sum, p) => sum + p.fiatValue, 0));
  const remaining = round2(Math.max(0, plan.price - paid));
  const percent = Math.min(100, Math.floor((paid / plan.price) * 100));
  const installmentAmount = round2(plan.price / plan.installments);
  const start = new Date(`${plan.startDate}T00:00:00Z`);

  const schedule: DueStep[] = [];
  for (let i = 0; i < plan.installments; i++) {
    const cumulative = i === plan.installments - 1 ? plan.price : round2(installmentAmount * (i + 1));
    schedule.push({
      index: i + 1,
      date: addCadence(start, plan.cadence, i).toISOString().slice(0, 10),
      amount: i === plan.installments - 1 ? round2(plan.price - installmentAmount * i) : installmentAmount,
      cumulative,
      covered: paid + 0.005 >= cumulative,
    });
  }

  const today = now.toISOString().slice(0, 10);
  // An installment is overdue only after its due date has passed, not on the day itself.
  const dueSoFar = schedule.filter((s) => s.date < today).at(-1)?.cumulative ?? 0;
  return {
    paid,
    remaining,
    percent,
    fullyPaid: remaining <= 0.005,
    installmentAmount,
    schedule,
    nextDue: schedule.find((s) => !s.covered) ?? null,
    behindBy: round2(Math.max(0, dueSoFar - paid)),
  };
}

/** `symbol: false` keeps the ISO code (GHS, NGN) for renderers without the ₵ / ₦ glyphs, such as the share images. */
export function formatMoney(amount: number, currency: Currency, { symbol = true }: { symbol?: boolean } = {}) {
  if (currency === "NIM") {
    return `${new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(amount)} NIM`;
  }
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      currencyDisplay: symbol ? "narrowSymbol" : "code",
      maximumFractionDigits: amount >= 1000 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/** NIM to 2 decimals in summaries, 4 in receipts and chain rows. */
export function formatNim(luna: number, decimals: 2 | 4 = 2) {
  return `${new Intl.NumberFormat("en", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(luna / LUNA_PER_NIM)} NIM`;
}

export function formatDate(iso: string) {
  return new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso).toLocaleDateString("en", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

export function explorerTxUrl(network: Network, hash: string) {
  return network === "mainnet"
    ? `https://nimiq.watch/#${hash}`
    : `https://test.nimiq.watch/#${hash}`;
}
