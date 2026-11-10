"use client";

import { useEffect, useState } from "react";
import { PlanProgress } from "./plan-progress";
import { CheckGlyph } from "./ui";
import { PhoneArt } from "./phone-art";
import { computeProgress, type Plan } from "@/lib/shared";

const naira = (n: number) =>
  new Intl.NumberFormat("en", { style: "currency", currency: "NGN", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(n);

// An example plan, labelled as one on screen: the phone everyone wants this season, paid off small small.
const EXAMPLE = {
  price: 2400000,
  installments: 8,
  cadence: "weekly",
  startDate: "2026-01-01",
  currency: "NGN",
} as Plan;

function scheduleFor(paidCount: number) {
  const paid = (EXAMPLE.price / EXAMPLE.installments) * paidCount;
  return computeProgress(
    EXAMPLE,
    [{ hash: "", fromAddress: "", valueLuna: 0, rate: 0, fiatValue: paid, blockNumber: 0, paidAt: "", rateSource: "live" }],
    new Date("2026-01-01T00:00:00Z"),
  );
}

/**
 * Landing hero: the paper tag a shop ties to a reserved item, as Layby draws it.
 * Plays one state change, once: the fourth payment is checked and its brick fills. No count-up on money (DESIGN.md §9).
 */
export function LaybyTag() {
  const [paidCount, setPaidCount] = useState(3);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setPaidCount(4), 1800);
    return () => clearTimeout(t);
  }, []);

  const progress = scheduleFor(paidCount);
  const next = progress.nextDue;

  return (
    <figure className="tag-card px-5 pt-12 pb-5" aria-label="Example layby plan">
      <span className="tag-hole" aria-hidden="true" />
      <div className="num absolute top-[18px] right-5 left-11 flex justify-between text-label text-ink-muted uppercase">
        <span>Nº a7f3c2</span>
        <span>Example</span>
      </div>

      <div className="-mx-1 mb-5 rounded-tile bg-canvas-sunk px-2 pt-3 pb-1">
        <PhoneArt paidCount={paidCount} className="block h-auto w-full" />
      </div>

      <p className="num text-label text-ink-muted uppercase">Reserved for Ada</p>
      <p className="mt-1 font-display text-display-l">iPhone 18 Pro Max</p>
      <p className="mt-1 text-body-s text-ink-muted">Ade Phones · Computer Village</p>

      <div className="dotted my-5" />

      <p className="num text-amount-hero max-[360px]:text-[2rem]">{naira(progress.paid)}</p>
      <p className="num text-amount-s text-ink-muted">of {naira(EXAMPLE.price)} paid</p>

      <div className="mt-5">
        <PlanProgress schedule={progress.schedule} />
      </div>

      <div className="mt-4 flex min-h-6 flex-wrap items-center justify-between gap-x-3 gap-y-2">
        {paidCount === 4 ? (
          <p key="checked" className="fade-late num flex items-center gap-2 whitespace-nowrap text-label text-green uppercase">
            <CheckGlyph ok /> Payment 4 checked
          </p>
        ) : (
          <p className="num text-label text-ink-muted uppercase">Shop keeps it safe</p>
        )}
        {next && (
          <p className="num shrink-0 text-label text-ink-muted uppercase">
            Next {naira(next.amount)}
          </p>
        )}
      </div>
    </figure>
  );
}
