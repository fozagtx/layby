"use client";

import { useHost } from "@/lib/client/nimiq";
import type { Network } from "@/lib/shared";
import { Pill } from "./ui";

export function NetworkPill({ network }: { network: Network }) {
  return network === "testnet" ? (
    <Pill tone="ochre" glyph="◐">Testnet</Pill>
  ) : (
    <Pill tone="green" glyph="■">Mainnet</Pill>
  );
}

export function NetworkBadge() {
  const host = useHost();
  if (host.status === "checking") return <span className="h-7" />;
  if (host.status === "outside") return <Pill tone="muted" glyph="○">Browser</Pill>;
  return <NetworkPill network={host.network} />;
}
