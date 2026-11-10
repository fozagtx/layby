import { ImageResponse } from "next/og";
import { getPayments, getPlan } from "@/lib/server/db";
import { OG, OgBricks, OgFrame, OgMark, ogFonts } from "@/lib/server/og";
import { computeProgress, formatMoney } from "@/lib/shared";

export const alt = "A Layby plan: reserve an item today, pay it off in NIM installments";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The preview a customer sees when the shop sends the plan link on WhatsApp or X:
 * shop, item, and the bricks so far. Generated per plan.
 */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = await getPlan(id);

  if (!plan) {
    const fonts = await ogFonts("Layby", "LAYBY");
    return new ImageResponse(
      (
        <OgFrame>
          <OgMark size={72} />
          <div style={{ display: "flex", marginTop: 40, fontFamily: "Serif", fontSize: 96, color: OG.ink }}>Layby</div>
        </OgFrame>
      ),
      { ...size, fonts },
    );
  }

  const progress = computeProgress(plan, await getPayments(id));
  const paidCount = progress.schedule.filter((s) => s.covered).length;
  const status =
    plan.status === "collected" ? "COLLECTED" : progress.fullyPaid ? "PAID IN FULL" : `${paidCount} OF ${plan.installments} PAID`;
  const amount = `${formatMoney(progress.paid, plan.currency, { symbol: false })} of ${formatMoney(plan.price, plan.currency, { symbol: false })}`;
  const shop = plan.merchantName.toUpperCase();
  const fonts = await ogFonts(`${plan.item}Layby`, `${shop}${status}${amount}0123456789 LAYBY·PAIDINNIM`);

  return new ImageResponse(
    (
      <OgFrame>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <OgMark size={52} />
            <div style={{ display: "flex", fontFamily: "Serif", fontSize: 48, color: OG.ink }}>Layby</div>
          </div>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 3, color: OG.muted }}>{shop.slice(0, 32)}</div>
        </div>

        <div style={{ display: "flex", marginTop: 64, fontFamily: "Serif", fontSize: plan.item.length > 26 ? 72 : 96, lineHeight: 1.05, color: OG.ink }}>
          {plan.item.slice(0, 48)}
        </div>

        <div style={{ display: "flex", flex: 1 }} />

        <OgBricks total={plan.installments} paid={paidCount} width={1072} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, fontSize: 30, color: OG.ink }}>
          <div style={{ display: "flex", letterSpacing: 3, color: progress.fullyPaid ? OG.green : OG.ink }}>{status}</div>
          <div style={{ display: "flex", color: OG.muted }}>{amount}</div>
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
