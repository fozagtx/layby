import { Suspense } from "react";
import { PlanView } from "./plan-view";

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
