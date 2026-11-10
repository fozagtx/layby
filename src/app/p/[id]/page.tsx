import type { Metadata } from "next";
import { Suspense } from "react";
import { getPlan } from "@/lib/server/db";
import { PlanView } from "./plan-view";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const plan = await getPlan(id).catch(() => null);
  if (!plan) return { title: "Plan not found" };
  const description = `${plan.merchantName} is holding this for ${plan.customerName || "you"}. Pay it off in NIM, take it home when it's paid.`;
  return {
    title: `${plan.item} at ${plan.merchantName}`,
    description,
    openGraph: { title: `${plan.item} · ${plan.merchantName}`, description },
    twitter: { card: "summary_large_image" },
  };
}

async function PlanById({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlanView id={id} />;
}

export default function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="num py-10 text-center text-label text-ink-muted uppercase">Loading plan</p>}>
      <PlanById params={params} />
    </Suspense>
  );
}
