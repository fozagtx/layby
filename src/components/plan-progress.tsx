"use client";

import { useState } from "react";
import type { DueStep } from "@/lib/shared";

/**
 * The hero component. One brick per installment, never a smooth bar. DESIGN.md §5.1.
 * ≤12 installments: 32px bricks. 13–24: 20px bricks. >24: chalk tally in groups of five.
 */
export function PlanProgress({
  schedule,
  onSelect,
  size = "l",
}: {
  schedule: DueStep[];
  onSelect?: (index: number) => void;
  size?: "l" | "s";
}) {
  const paidCount = schedule.filter((s) => s.covered).length;
  const total = schedule.length;
  const nextIndex = schedule.findIndex((s) => !s.covered);

  // First render: paid bricks fill left to right with a stagger. Later, only newly paid bricks animate.
  const [previous, setPrevious] = useState<number | null>(null);
  const [lastPaid, setLastPaid] = useState(paidCount);
  if (paidCount !== lastPaid) {
    setPrevious(lastPaid);
    setLastPaid(paidCount);
  }

  const label = `${paidCount} of ${total} paid`;

  if (total > 24) {
    return (
      <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={paidCount} aria-label={label}>
        <p className="num text-amount-m tracking-widest text-green" aria-hidden="true">
          {tally(paidCount)}
          <span className="text-hairline-firm">{tally(total - paidCount, true)}</span>
        </p>
        <p className="num mt-2 text-label text-ink-muted uppercase" aria-live="polite">{label}</p>
      </div>
    );
  }

  const height = size === "s" ? 14 : total > 12 ? 20 : 32;
  const gap = total > 12 || size === "s" ? 2 : 4;

  return (
    <div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={paidCount}
        aria-label={label}
        className="flex w-full"
        style={{ gap }}
      >
        {schedule.map((s, i) => {
          const state = s.covered ? "paid" : i === nextIndex ? "next" : "open";
          const fresh = previous !== null && s.covered && i >= previous;
          const common = {
            className: "brick",
            "data-state": state,
            "data-fresh": fresh ? "true" : undefined,
            style: { height, animationDelay: previous === null && s.covered ? `${i * 40}ms` : undefined },
          };
          return onSelect ? (
            <button
              key={s.index}
              type="button"
              {...common}
              onClick={() => onSelect(i)}
              aria-label={`Installment ${s.index}: ${s.covered ? "paid" : `due ${s.date}`}`}
            />
          ) : (
            <span key={s.index} {...common} />
          );
        })}
      </div>
      {size === "l" && (
        <p className="num mt-2 text-label text-ink-muted uppercase" aria-live="polite">
          {label}
        </p>
      )}
    </div>
  );
}

function tally(n: number, faint = false) {
  const groups = Math.floor(n / 5);
  const rest = n % 5;
  return `${"卌 ".repeat(groups)}${"|".repeat(rest)}${faint ? "" : " "}`;
}
