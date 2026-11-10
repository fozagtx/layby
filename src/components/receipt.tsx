"use client";

import { useState } from "react";
import { CheckGlyph } from "./ui";
import {
  explorerTxUrl,
  formatAddress,
  formatDate,
  formatMoney,
  formatNim,
  shortHash,
  type Payment,
  type Plan,
} from "@/lib/shared";

export interface ReceiptChecks {
  found: boolean;
  recipient: boolean;
  memo: boolean;
  executed: boolean;
  amount: boolean;
  unique: boolean;
}

/** The trust artifact: a till receipt listing all six on-chain checks. DESIGN.md §5.2. */
export function Receipt({
  plan,
  payment,
  checks,
  memo,
  source,
  stamp,
}: {
  plan: Plan;
  payment: Payment;
  checks: ReceiptChecks | null; // null while checking
  memo: string;
  source: "live" | "stored";
  stamp?: "paid" | "collected" | null;
}) {
  const [copied, setCopied] = useState(false);

  const rows: { key: keyof ReceiptChecks; label: string; value?: string; failed: string }[] = [
    { key: "found", label: "Transaction found", failed: "The chain doesn't know this transaction." },
    { key: "recipient", label: "Recipient is this shop", failed: "It went to a different wallet." },
    { key: "memo", label: "Memo tag", value: memo || "none", failed: "The tag doesn't match this plan." },
    { key: "executed", label: "Executed successfully", failed: "The network rejected it." },
    { key: "amount", label: "Amount", value: formatNim(payment.valueLuna, 4), failed: "The amount on chain differs." },
    { key: "unique", label: "Not a duplicate", failed: "Already counted once." },
  ];

  async function copyHash() {
    try {
      await navigator.clipboard.writeText(payment.hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the full hash is selectable below */
    }
  }

  return (
    <article className="receipt num relative text-amount-s" aria-label="Payment receipt">
      <div className="text-center">
        <p className="text-label tracking-[0.14em] uppercase">{plan.merchantName}</p>
        <p className="mt-1 text-caption text-ink-muted">{formatDate(payment.paidAt)} · block {payment.blockNumber.toLocaleString("en")}</p>
      </div>

      <div className="dotted my-4" />
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-sans text-body-s">{plan.item}</span>
      </div>
      <div className="mt-2 flex justify-between">
        <span className="text-ink-muted">Paid</span>
        <span className="font-semibold">{formatNim(payment.valueLuna, 4)}</span>
      </div>
      {plan.currency !== "NIM" && (
        <div className="flex justify-between">
          <span className="text-ink-muted">Counted as</span>
          <span>{formatMoney(payment.fiatValue, plan.currency)}</span>
        </div>
      )}
      {plan.currency !== "NIM" && (
        <div className="flex justify-between text-caption text-ink-muted">
          <span>Rate</span>
          <span>
            1 NIM = {payment.rate.toPrecision(4)} {plan.currency} · {payment.rateSource === "locked" ? "locked" : "at check"}
          </span>
        </div>
      )}

      <div className="dotted my-4" />
      <p className="text-label tracking-[0.14em] uppercase" aria-live="polite">
        {checks ? (
          Object.values(checks).every(Boolean) ? "Verified on-chain" : <span className="text-clay">△ Failed a chain check</span>
        ) : (
          <span className="inline-flex items-center gap-2 text-ink-muted">
            <span className="pulse-dot" /> Checking on-chain…
          </span>
        )}
      </p>
      <ul className="mt-3 space-y-2.5">
        {rows.map((r) => {
          const ok = checks ? checks[r.key] : null;
          return (
            <li key={r.key} className={ok === null ? "opacity-50" : ""}>
              <div className="flex items-center gap-3">
                {ok === null ? <span className="h-4 w-4 rounded-[3px] border border-hairline-firm" /> : <CheckGlyph ok={ok} />}
                <span className="flex-1">{r.label}</span>
                {r.value && <span className="truncate text-right">{r.value}</span>}
              </div>
              {ok === false && <p className="mt-1 pl-7 font-sans text-body-s text-clay">{r.failed}</p>}
            </li>
          );
        })}
      </ul>
      <div className="dotted my-4" />

      <div className="flex items-center gap-2">
        <span className="text-ink-muted">HASH</span>
        <span className="flex-1" title={payment.hash}>{shortHash(payment.hash)}</span>
        <button type="button" onClick={copyHash} className="no-print rounded-pill border border-hairline-firm px-3 py-1.5 text-label uppercase">
          {copied ? "Copied" : "Copy"}
        </button>
        <a href={explorerTxUrl(plan.network, payment.hash)} target="_blank" rel="noreferrer"
          className="no-print rounded-pill border border-hairline-firm px-3 py-1.5 text-label uppercase" aria-label="View on explorer">
          ↗
        </a>
      </div>
      <p className="mt-3 text-caption break-all text-ink-faint">To {formatAddress(plan.merchantAddress)}</p>
      <p className="mt-1 text-caption text-ink-faint">
        {source === "live" ? "Re-checked against the Nimiq chain just now." : "Network unreachable. Showing the record checked when this payment arrived."}
      </p>

      {stamp && (
        <div className="pointer-events-none absolute top-24 right-4">
          <span className="stamp text-green">{stamp === "collected" ? "Collected" : "Paid in full"}</span>
        </div>
      )}
    </article>
  );
}
