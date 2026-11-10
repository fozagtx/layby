"use client";

import { useHost } from "@/lib/client/nimiq";
import type { Network } from "@/lib/shared";
import { Pill } from "./ui";

/** Mainnet is the normal case and shows nothing. Only testnet is flagged, so test money is never mistaken for real. */
export function NetworkPill({ network }: { network: Network }) {
  return network === "testnet" ? <Pill tone="ochre" glyph="◐">Testnet</Pill> : null;
}

/** Header badge: shown once, only when Nimiq Pay itself is on testnet. */
export function NetworkBadge() {
  const host = useHost();
  if (host.status !== "inside") return null;
  return <NetworkPill network={host.network} />;
}
