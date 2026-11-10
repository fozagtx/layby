"use client";

import Link from "next/link";
import { useState } from "react";
import { useHost, walletErrorMessage } from "@/lib/client/nimiq";
import { PlanCard } from "@/components/plan-card";
import { PlanProgress } from "@/components/plan-progress";
import { Shopfront } from "@/components/shop-header";
import { Notice, Rule } from "@/components/ui";
import { computeProgress, type Plan } from "@/lib/shared";

type PlanRow = Plan & { paid: number };

// Illustrative bricks for the hero: 3 of 8 paid, the "count on your fingers" idea.
const HERO_SCHEDULE = computeProgress(
  { price: 8, installments: 8, cadence: "weekly", startDate: "2026-01-01" } as Plan,
  [{ hash: "", fromAddress: "", valueLuna: 0, rate: 0, fiatValue: 3, blockNumber: 0, paidAt: "", rateSource: "live" }],
  new Date("2026-01-01T00:00:00Z"),
).schedule;

export default function Home() {
  const host = useHost();
  const [plans, setPlans] = useState<PlanRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadMyPlans() {
    if (!host.provider) return;
    setError(null);
    setLoading(true);
    try {
      const [wallet] = await host.provider.listAccounts();
      const res = await fetch(`/api/merchants/${encodeURIComponent(wallet)}`);
      if (!res.ok) throw new Error("Couldn't load your plans. Try again.");
      setPlans((await res.json()).plans);
    } catch (e) {
      setError(walletErrorMessage(e).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 pt-4">
      <section>
        <h1 className="font-display text-display-xl">Reserve it today.</h1>
        <p className="mt-3 text-body">
          Reserve it today, pay it off in NIM, take it home when it&apos;s paid. Layby is layaway for local shops,
          inside Nimiq Pay.
        </p>
        <div className="mt-6 rounded-card border border-hairline bg-surface p-5">
          <div className="mb-4 flex h-24 items-center justify-center rounded-tile bg-canvas-sunk">
            <Shopfront className="h-20" />
          </div>
          <PlanProgress schedule={HERO_SCHEDULE} />
          <p className="mt-3 text-body-s text-ink-muted">
            One brick per payment. The shop keeps the item; you pay small small; every payment is checked on the
            Nimiq chain.
          </p>
        </div>
        <div className="mt-6 grid gap-3">
          <Link href="/new" className="btn btn-primary">Create a plan</Link>
          <Link href="/how" className="btn btn-secondary">How it works</Link>
        </div>
      </section>

      {host.status === "inside" && (
        <section>
          <Rule label="Your shop" />
          {plans === null ? (
            <button className="btn btn-secondary" onClick={loadMyPlans} disabled={loading}>
              {loading ? <span className="working">Working</span> : "Show my plans"}
            </button>
          ) : plans.length === 0 ? (
            <div className="rounded-card bg-canvas-sunk p-6 text-center">
              <Shopfront className="mx-auto h-20" />
              <p className="mt-3 font-display text-display-m">No plans yet.</p>
              <p className="mt-1 text-body-s text-ink-muted">Put your first item on layby. It takes a minute.</p>
              <Link href="/new" className="btn btn-primary mt-4">Create a plan</Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {plans.map((p) => (
                <li key={p.id}><PlanCard plan={p} paid={p.paid} /></li>
              ))}
            </ul>
          )}
          {error && <div className="mt-3"><Notice tone="clay">{error}</Notice></div>}
        </section>
      )}

      {host.status === "outside" && (
        <Notice tone="muted">
          You&apos;re in a regular browser. You can look at plans here. Paying and creating plans with your wallet
          happens in the Nimiq Pay app, under Mini Apps.
        </Notice>
      )}
    </div>
  );
}
