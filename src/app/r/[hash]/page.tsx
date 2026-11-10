import { Suspense } from "react";
import { ReceiptView } from "./receipt-view";

async function ByHash({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  return <ReceiptView hash={hash} />;
}

export default function ReceiptPage({ params }: { params: Promise<{ hash: string }> }) {
  return (
    <Suspense fallback={<p className="num py-10 text-center text-label text-ink-muted uppercase">Loading receipt</p>}>
      <ByHash params={params} />
    </Suspense>
  );
}
