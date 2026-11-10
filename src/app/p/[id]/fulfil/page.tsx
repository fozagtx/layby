import { Suspense } from "react";
import { FulfilView } from "./fulfil-view";

async function ById({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FulfilView id={id} />;
}

export default function FulfilPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="num py-10 text-center text-label text-ink-muted uppercase">Loading</p>}>
      <ById params={params} />
    </Suspense>
  );
}
