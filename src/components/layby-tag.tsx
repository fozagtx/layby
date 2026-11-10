"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { PlanProgress } from "./plan-progress";
import { CheckGlyph } from "./ui";
import { computeProgress, type Plan } from "@/lib/shared";
import heroPhone from "../../public/hero-phone.jpg";

const cedis = (n: number) =>
  new Intl.NumberFormat("en", { style: "currency", currency: "GHS", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(n);

// An example plan, labelled as one on screen: this season's phone, paid off in eight parts.
const EXAMPLE = { price: 24000, installments: 8, cadence: "weekly", startDate: "2026-01-01", currency: "GHS" } as Plan;

function progressFor(paidCount: number) {
  const paid = (EXAMPLE.price / EXAMPLE.installments) * paidCount;
  return computeProgress(
    EXAMPLE,
    [{ hash: "", fromAddress: "", valueLuna: 0, rate: 0, fiatValue: paid, blockNumber: 0, paidAt: "", rateSource: "live" }],
    new Date("2026-01-01T00:00:00Z"),
  );
}

/**
 * Landing hero: one item on layby. Plays one state change, once: payment 4 is checked and its brick fills.
 * No count-up on money (DESIGN.md §9).
 */
export function LaybyTag() {
  const [paidCount, setPaidCount] = useState(3);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setPaidCount(4), 1800);
    return () => clearTimeout(t);
  }, []);

  const progress = progressFor(paidCount);

  return (
    <figure className="overflow-hidden rounded-card border border-hairline bg-surface" aria-label="Example layby plan">
      <div className="relative">
        <Image
          src={heroPhone}
          alt="An iPhone 18 Pro held in a hand"
          priority
          sizes="(max-width: 420px) 100vw, 380px"
          className="aspect-[5/4] h-auto w-full object-cover"
        />
        <span className="num absolute top-3 left-3 rounded-pill bg-surface/90 px-3 py-1 text-label text-ink uppercase">
          Example
        </span>
      </div>

      <div className="p-5">
        <p className="font-display text-display-m">iPhone 18 Pro Max</p>
        <p className="num mt-3 text-amount-m">
          {cedis(progress.paid)}
          <span className="text-ink-muted"> of {cedis(EXAMPLE.price)}</span>
        </p>
        <div className="mt-4">
          <PlanProgress schedule={progress.schedule} />
        </div>
        <p className="num mt-3 flex min-h-5 items-center gap-2 text-label uppercase">
          {paidCount === 4 ? (
            <span key="checked" className="fade-late flex items-center gap-2 text-green">
              <CheckGlyph ok /> Payment 4 checked on-chain
            </span>
          ) : (
            <span className="text-ink-muted">Shop holds it while you pay</span>
          )}
        </p>
      </div>
    </figure>
  );
}
