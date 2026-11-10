import { NextResponse } from "next/server";
import { rowToPlan, sql } from "@/lib/server/db";
import { formatAddress, isValidNimiqAddress } from "@/lib/shared";

/** Plans that pay to a given wallet. Plans are public by design (the link is the plan). */
export async function GET(_req: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const decoded = decodeURIComponent(address);
  if (!isValidNimiqAddress(decoded)) return NextResponse.json({ error: "invalid_address" }, { status: 400 });

  const rows = await sql`
    SELECT p.id, p.network, p.merchant_name, p.merchant_address, p.shop_place, p.collect_by, p.item, p.note,
           p.customer_name, p.price, p.currency, p.installments, p.cadence, p.start_date, p.policy, p.status,
           p.collected_at, p.created_at, (p.item_photo IS NOT NULL) AS has_photo,
           COALESCE(SUM(pay.fiat_value), 0) AS paid
    FROM plans p LEFT JOIN payments pay ON pay.plan_id = p.id
    WHERE p.merchant_address = ${formatAddress(decoded)}
    GROUP BY p.id ORDER BY p.created_at DESC LIMIT 50`;
  return NextResponse.json({ plans: rows.map((r) => ({ ...rowToPlan(r), paid: Number(r.paid) })) });
}
