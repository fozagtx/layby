import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/server/db";
import { hashToken, newCollectCode, newManageToken, newPlanId } from "@/lib/server/tokens";
import { CURRENCIES, isValidNimiqAddress, formatAddress } from "@/lib/shared";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
// Photos are resized on the phone to ~800px JPEG; this cap is a safety net, not the expected size.
const PHOTO = /^data:image\/(jpeg|webp|png);base64,[A-Za-z0-9+/=]+$/;

const CreatePlan = z.object({
  network: z.enum(["mainnet", "testnet"]),
  merchantName: z.string().trim().min(1).max(60),
  merchantAddress: z.string().refine(isValidNimiqAddress, "Not a valid Nimiq address"),
  shopPlace: z.string().trim().max(60).default(""),
  item: z.string().trim().min(1).max(80),
  itemPhoto: z.string().max(400_000).regex(PHOTO, "Unsupported photo").nullable().default(null),
  note: z.string().trim().max(280).default(""),
  customerName: z.string().trim().max(60).default(""),
  price: z.number().positive().max(1e12),
  currency: z.enum(CURRENCIES),
  installments: z.number().int().min(1).max(52),
  cadence: z.enum(["weekly", "biweekly", "monthly"]),
  startDate: z.string().regex(DATE),
  collectBy: z.string().regex(DATE).nullable().default(null),
  policy: z.string().trim().min(1, "Choose a refund policy").max(400),
});

export async function POST(req: Request) {
  const parsed = CreatePlan.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) },
      { status: 400 },
    );
  }
  const p = parsed.data;
  const id = newPlanId();
  const token = newManageToken();

  await sql`
    INSERT INTO plans (id, network, merchant_name, merchant_address, shop_place, item, item_photo, note,
                       customer_name, price, currency, installments, cadence, start_date, collect_by, policy,
                       manage_token_hash, collect_code)
    VALUES (${id}, ${p.network}, ${p.merchantName}, ${formatAddress(p.merchantAddress)}, ${p.shopPlace}, ${p.item},
            ${p.itemPhoto}, ${p.note}, ${p.customerName}, ${p.price}, ${p.currency}, ${p.installments}, ${p.cadence},
            ${p.startDate}, ${p.collectBy}, ${p.policy}, ${hashToken(token)}, ${newCollectCode()})`;

  return NextResponse.json({ id, manageToken: token }, { status: 201 });
}
