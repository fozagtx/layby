"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Receipt, type ReceiptChecks } from "@/components/receipt";
import { Notice, Skeleton } from "@/components/ui";
import { explorerTxUrl, type Payment, type Plan } from "@/lib/shared";

interface ReceiptData {
  plan: Plan;
  payment: Payment;
  checks: ReceiptChecks;
  memo: string;
  source: "live" | "stored";
}

export function ReceiptView({ hash }: { hash: string }) {
  const fromPay = useSearchParams().get("from") === "pay";
  const [data, setData] = useState<ReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/receipts/${hash}`, { cache: "no-store" })
      .then(async (r) => {
        if (r.status === 404) throw new Error("We don't have a payment with this hash. It may still be on its way.");
        if (!r.ok) throw new Error("Couldn't load this receipt. Try again.");
        return (await r.json()) as ReceiptData;
      })
      .then((d) => alive && setData(d))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [hash]);

  if (error) return <Notice tone="clay">{error}</Notice>;
  if (!data) {
    return (
      <div className="space-y-4 pt-4" aria-busy="true">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  const { plan, payment } = data;

  async function share() {
    const url = window.location.href.split("?")[0];
    if (navigator.share) await navigator.share({ title: `Receipt · ${plan.item}`, url }).catch(() => {});
    else await navigator.clipboard?.writeText(url).catch(() => {});
  }

  return (
    <div className="space-y-6 pt-2">
      <div>
        <h1 className="font-display text-display-l">{fromPay ? "Payment counted." : "Receipt."}</h1>
        <p className="text-body-s text-ink-muted">
          {fromPay ? "We found it on the Nimiq chain and added it to your plan." : `For ${plan.item} at ${plan.merchantName}.`}
        </p>
      </div>

      <Receipt
        plan={plan}
        payment={payment}
        checks={data.checks}
        memo={data.memo}
        source={data.source}
        stamp={plan.status === "collected" ? "collected" : null}
      />

      <div className="no-print grid gap-3">
        <Link href={`/p/${plan.id}`} className="btn btn-primary">Back to the plan</Link>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="btn btn-secondary" onClick={share}>Share</button>
          <a href={explorerTxUrl(plan.network, payment.hash)} target="_blank" rel="noreferrer" className="btn btn-secondary">
            Explorer ↗
          </a>
        </div>
      </div>
    </div>
  );
}
