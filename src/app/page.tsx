"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { local, useHost, walletErrorMessage } from "@/lib/client/nimiq";
import { LaybyTag } from "@/components/layby-tag";
import { PlanCard } from "@/components/plan-card";
import { CheckGlyph, Notice, Rule } from "@/components/ui";
import type { Plan } from "@/lib/shared";

type PlanRow = Plan & { paid: number };

const STEPS = [
  { title: "The shop reserves it", body: "The shop sets the price, the number of payments and its refund policy, then sends you a link." },
  { title: "You pay small small", body: "Open the link in Nimiq Pay and pay each part in NIM, when you're ready. One brick fills per payment." },
  { title: "You take it home", body: "When the last brick fills, show your collect code at the counter. The item is yours." },
];

const CHECKS = [
  "Transaction found",
  "Sent to this shop",
  "Tagged for this plan",
  "Executed successfully",
  "The right amount",
  "Not counted before",
];

const SHOWN_PLANS_KEY = "layby:shop-plans";

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
      local.set(SHOWN_PLANS_KEY, "1");
    } catch (e) {
      setError(walletErrorMessage(e).message);
    } finally {
      setLoading(false);
    }
  }

  // A shop that has opened its plans before sees them straight away next time.
  useEffect(() => {
    if (host.status !== "inside" || local.get(SHOWN_PLANS_KEY) !== "1") return;
    const t = setTimeout(() => void loadMyPlans(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host.status]);

  return (
    <div className="pt-2">
      {/* 1. Promise */}
      <section>
        <h1 className="font-display text-display-xl text-balance">Reserve an item today.</h1>
        <p className="mt-3 font-display text-display-m text-ink-muted text-balance">
          Pay it off in NIM installments. Take it home when it&apos;s paid.
        </p>
      </section>

      {/* 2. The product, shown */}
      <section className="mt-6">
        <LaybyTag />
      </section>

      {/* 3. One action */}
      <section className="mt-8">
        <Link href="/new" className="btn btn-primary">Create a plan</Link>
        <p className="mt-3 text-center text-body-s text-ink-muted">
          For shops. Customers pay from the link the shop sends.
        </p>
      </section>

      {/* 4. How it works */}
      <section className="mt-12">
        <Rule label="How it works" />
        <ol className="space-y-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="num w-7 shrink-0 pt-1 text-label text-ochre">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h2 className="font-display text-display-m">{s.title}</h2>
                <p className="mt-1 text-body-s text-ink-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link href="/how" className="btn btn-ghost mt-4">Read the full details →</Link>
      </section>

      {/* 5. The trust mechanism */}
      <section className="mt-10">
        <div className="receipt">
          <p className="num text-label text-ink-muted uppercase">Every payment, checked</p>
          <h2 className="mt-2 font-display text-display-m">Six checks before a payment counts.</h2>
          <div className="dotted my-4" />
          <ul className="space-y-3">
            {CHECKS.map((c) => (
              <li key={c} className="num flex items-center gap-3 text-amount-s">
                <CheckGlyph ok /> {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. Returning shops (inside Nimiq Pay only) */}
      {host.status === "inside" && (
        <section className="mt-10">
          <Rule label="Your shop" />
          {plans === null ? (
            <div className="rounded-card border border-hairline bg-surface p-5">
              <p className="font-display text-display-m">Already selling on Layby?</p>
              <p className="mt-1 text-body-s text-ink-muted">
                See the plans you created with this Nimiq Pay wallet.
              </p>
              <button className="btn btn-secondary mt-4" onClick={loadMyPlans} disabled={loading}>
                {loading ? <span className="working">Working</span> : "See my plans"}
              </button>
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-card bg-canvas-sunk p-5">
              <p className="font-display text-display-m">No plans from this wallet yet.</p>
              <p className="mt-1 text-body-s text-ink-muted">Put your first item on layby. It takes a minute.</p>
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
        <div className="mt-10">
          <Notice tone="muted">
            You&apos;re in a regular browser. You can look at plans here. Paying and creating plans happens in the
            Nimiq Pay app, under Mini Apps.
          </Notice>
        </div>
      )}
    </div>
  );
}
