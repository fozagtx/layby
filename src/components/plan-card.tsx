import Link from "next/link";
import { computeProgress, formatDate, formatMoney, type Plan } from "@/lib/shared";
import { PlanProgress } from "./plan-progress";
import { Pill } from "./ui";
import { Shopfront } from "./shop-header";

/** DESIGN.md §6 PlanCard. Whole card is the tap target. */
export function PlanCard({ plan, paid }: { plan: Plan; paid: number }) {
  // A summary card only knows the total paid; one synthetic payment is enough to fill the bricks.
  const progress = computeProgress(plan, paid > 0 ? [{ hash: "", fromAddress: "", valueLuna: 0, rate: 0, fiatValue: paid, blockNumber: 0, paidAt: plan.createdAt, rateSource: "live" }] : []);
  const paidCount = progress.schedule.filter((s) => s.covered).length;

  return (
    <Link href={`/p/${plan.id}`} className="block rounded-card border border-hairline bg-surface p-4">
      <div className="mb-4 aspect-[4/3] overflow-hidden rounded-tile bg-canvas-sunk">
        {plan.hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/plans/${plan.id}/photo`} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <Shopfront className="h-full w-full p-8" />
        )}
      </div>
      <p className="text-body font-medium">{plan.item}</p>
      <p className="text-body-s text-ink-muted">{plan.customerName ? `For ${plan.customerName}` : plan.merchantName}</p>
      <div className="mt-4">
        <PlanProgress schedule={progress.schedule} size="s" />
      </div>
      <p className="num mt-3 text-amount-m">
        {formatMoney(progress.paid, plan.currency)}
        <span className="text-ink-muted"> / {formatMoney(plan.price, plan.currency)}</span>
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {plan.status === "collected" ? (
          <Pill tone="green" glyph="▣">Collected</Pill>
        ) : progress.fullyPaid ? (
          <Pill tone="green" glyph="■">Paid in full</Pill>
        ) : (
          <Pill tone="ochre" glyph="◐">{paidCount} of {plan.installments} paid</Pill>
        )}
        {plan.status === "active" && progress.nextDue && (
          <span className="num text-label text-ink-muted uppercase">Due {formatDate(progress.nextDue.date)}</span>
        )}
      </div>
    </Link>
  );
}
