import { after, NextResponse } from "next/server";
import { getPayments, getPlan } from "@/lib/server/db";
import { sweepPlan } from "@/lib/server/payments";
import { tokenMatches } from "@/lib/server/tokens";
import { computeProgress } from "@/lib/shared";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await getPlan(id);
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { manageTokenHash, collectCode, ...plan } = found;
  // Re-scan the chain for payments the client never reported, without delaying this response;
  // anything found shows up on the page's next refresh.
  after(() => sweepPlan(plan));
  const payments = await getPayments(id);
  const progress = computeProgress(plan, payments);

  return NextResponse.json({
    plan,
    payments,
    progress,
    isMerchant: tokenMatches(req.headers.get("x-manage-token"), manageTokenHash),
    // The handover code appears once the plan is paid in full, for the customer to show at the counter.
    collectCode: progress.fullyPaid && plan.status === "active" ? collectCode : null,
  });
}
