import { NextResponse } from "next/server";
import { z } from "zod";
import { getPayments, getPlan, sql } from "@/lib/server/db";
import { tokenMatches } from "@/lib/server/tokens";
import { computeProgress } from "@/lib/shared";

const Body = z.object({ code: z.string().trim().toUpperCase().length(6) });

/**
 * The shop confirms the hand-over. Needs the shop's private link token (authority) and the
 * customer's 6-character collect code (proof the customer is at the counter), on a fully paid plan.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await getPlan(id);
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!tokenMatches(req.headers.get("x-manage-token"), found.manageTokenHash)) {
    return NextResponse.json({ error: "forbidden", message: "Only the shop can mark this as collected." }, { status: 403 });
  }
  if (found.status !== "active") return NextResponse.json({ error: "plan_closed", message: "This plan is already closed." }, { status: 409 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || parsed.data.code !== found.collectCode) {
    return NextResponse.json({ error: "wrong_code", message: "That code doesn't match this plan. Check it with the customer." }, { status: 422 });
  }

  const progress = computeProgress(found, await getPayments(id));
  if (!progress.fullyPaid) {
    return NextResponse.json({ error: "not_paid", message: "This plan is not fully paid yet." }, { status: 409 });
  }

  await sql`UPDATE plans SET status = 'collected', collected_at = now() WHERE id = ${id} AND status = 'active'`;
  return NextResponse.json({ status: "collected" });
}
