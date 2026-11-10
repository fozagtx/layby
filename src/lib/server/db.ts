import "server-only";
import { neon } from "@neondatabase/serverless";
import type { Payment, Plan } from "@/lib/shared";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

export const sql = neon(url);

type Row = Record<string, unknown>;

export function rowToPlan(r: Row): Plan {
  return {
    id: r.id as string,
    network: r.network as Plan["network"],
    merchantName: r.merchant_name as string,
    merchantAddress: r.merchant_address as string,
    shopPlace: (r.shop_place as string) ?? "",
    hasPhoto: Boolean(r.has_photo ?? r.item_photo),
    collectBy: r.collect_by
      ? r.collect_by instanceof Date
        ? r.collect_by.toISOString().slice(0, 10)
        : String(r.collect_by).slice(0, 10)
      : null,
    item: r.item as string,
    note: r.note as string,
    customerName: r.customer_name as string,
    price: Number(r.price),
    currency: r.currency as Plan["currency"],
    installments: Number(r.installments),
    cadence: r.cadence as Plan["cadence"],
    startDate:
      r.start_date instanceof Date
        ? r.start_date.toISOString().slice(0, 10)
        : String(r.start_date).slice(0, 10),
    policy: r.policy as string,
    status: r.status as Plan["status"],
    collectedAt: r.collected_at ? new Date(r.collected_at as string).toISOString() : null,
    createdAt: new Date(r.created_at as string).toISOString(),
  };
}

export function rowToPayment(r: Row): Payment {
  return {
    hash: r.hash as string,
    fromAddress: r.from_address as string,
    valueLuna: Number(r.value_luna),
    rate: Number(r.rate),
    fiatValue: Number(r.fiat_value),
    blockNumber: Number(r.block_number),
    paidAt: new Date(r.paid_at as string).toISOString(),
    rateSource: (r.rate_source as Payment["rateSource"]) ?? "live",
  };
}

export async function getPlan(
  id: string,
): Promise<(Plan & { manageTokenHash: string; collectCode: string }) | null> {
  // The photo column is excluded from plan reads; it is served by its own cached route.
  const rows = await sql`
    SELECT id, network, merchant_name, merchant_address, shop_place, collect_by, item, note, customer_name,
           price, currency, installments, cadence, start_date, policy, manage_token_hash, status,
           collected_at, created_at, collect_code, (item_photo IS NOT NULL) AS has_photo
    FROM plans WHERE id = ${id}`;
  if (!rows[0]) return null;
  return {
    ...rowToPlan(rows[0]),
    manageTokenHash: rows[0].manage_token_hash as string,
    collectCode: rows[0].collect_code as string,
  };
}

/** The public view of a plan: never the shop token hash or the collect code. */
export function publicPlan(p: Plan & { manageTokenHash?: string; collectCode?: string }): Plan {
  const copy = { ...p };
  delete copy.manageTokenHash;
  delete copy.collectCode;
  return copy;
}

export async function getPlanPhoto(id: string) {
  const rows = await sql`SELECT item_photo FROM plans WHERE id = ${id}`;
  return (rows[0]?.item_photo as string | null) ?? null;
}

export async function getPayments(planId: string): Promise<Payment[]> {
  const rows = await sql`SELECT * FROM payments WHERE plan_id = ${planId} ORDER BY paid_at DESC`;
  return rows.map(rowToPayment);
}
