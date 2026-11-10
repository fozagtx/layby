import { NextResponse } from "next/server";
import { z } from "zod";
import { getPlan } from "@/lib/server/db";
import { checkTransaction, getTransaction } from "@/lib/server/nimiq-rpc";
import { recordPayment } from "@/lib/server/payments";

const Body = z.object({
  hash: z.string().regex(/^[0-9a-f]{64}$/i),
  quote: z.string().max(400).optional(),
});

const REASONS: Record<string, string> = {
  wrong_recipient: "This payment did not go to this shop's wallet.",
  wrong_memo: "This payment is not tagged for this plan.",
  failed_execution: "The network rejected this payment.",
  zero_value: "This payment carried no NIM.",
};

/**
 * The client hands over a transaction hash (and the signed rate quote it paid against);
 * recipient, amount, memo and execution are read back from the chain.
 * 202 means "not on chain yet, ask again".
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_hash" }, { status: 400 });

  const plan = await getPlan(id);
  if (!plan) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (plan.status !== "active") return NextResponse.json({ error: "plan_closed" }, { status: 409 });

  const hash = parsed.data.hash.toLowerCase();
  let tx;
  try {
    tx = await getTransaction(plan.network, hash);
  } catch {
    return NextResponse.json({ status: "pending", message: "Could not reach the Nimiq network. Retrying." }, { status: 202 });
  }
  if (!tx) return NextResponse.json({ status: "pending" }, { status: 202 });

  const check = checkTransaction(tx, plan.id, plan.merchantAddress);
  if (!check.ok) {
    return NextResponse.json({ error: check.reason, message: REASONS[check.reason] }, { status: 422 });
  }

  const added = await recordPayment(plan, tx, parsed.data.quote);
  return NextResponse.json({ status: added ? "recorded" : "already_recorded", hash });
}
