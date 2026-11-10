"use client";

import { useEffect, useState } from "react";
import { getHostFiat, getHostNetwork, init, NimiqProviderError } from "@nimiq/mini-app-sdk";
import { CURRENCIES, type Currency, type Network } from "@/lib/shared";

type Provider = Awaited<ReturnType<typeof init>>;

export interface Host {
  /** "checking" until we know whether Nimiq Pay injected its provider. */
  status: "checking" | "inside" | "outside";
  network: Network;
  fiat: Currency;
  provider: Provider | null;
}

let providerPromise: Promise<Provider | null> | null = null;

function loadProvider() {
  if (!providerPromise) {
    providerPromise = init({ timeout: 4000 }).catch(() => null);
  }
  return providerPromise;
}

function hostNetwork(): Network {
  return getHostNetwork() ?? "testnet";
}

function hostFiat(): Currency {
  const fiat = String(getHostFiat() ?? "USD").toUpperCase();
  return (CURRENCIES as readonly string[]).includes(fiat) ? (fiat as Currency) : "USD";
}

export function useHost(): Host {
  const [host, setHost] = useState<Host>({ status: "checking", network: "testnet", fiat: "USD", provider: null });

  useEffect(() => {
    let alive = true;
    loadProvider().then((provider) => {
      if (!alive) return;
      setHost({
        status: provider ? "inside" : "outside",
        network: hostNetwork(),
        fiat: hostFiat(),
        provider,
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  return host;
}

/** Turns wallet errors into a sentence a shop owner can act on. */
export function walletErrorMessage(error: unknown) {
  if (NimiqProviderError.is(error)) {
    const type = String(error.type);
    if (/DENIED|REJECT|CANCEL/i.test(type)) return { kind: "cancelled" as const, message: "You cancelled in Nimiq Pay. Nothing was sent." };
    if (/OUTCOME_UNKNOWN/i.test(type)) {
      return {
        kind: "unknown" as const,
        message: "Nimiq Pay could not confirm whether this payment went out. Do not pay again; this page checks the chain and will show it if it arrived.",
      };
    }
    if (/INSUFFICIENT|BALANCE|FUNDS/i.test(type)) return { kind: "error" as const, message: "Not enough NIM in your wallet for this payment." };
    return { kind: "error" as const, message: error.message || "Nimiq Pay returned an error." };
  }
  return { kind: "error" as const, message: error instanceof Error ? error.message : "Something went wrong." };
}

/** Per-viewer conveniences only; Nimiq Pay may clear WebView storage, so nothing here is required. */
export const local = {
  get(key: string) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* storage blocked: the manage link in the URL still works */
    }
  },
};

export function openInNimiqPayUrl() {
  const target = `${window.location.host}${window.location.pathname}`;
  return `https://nimpay.app/miniapps/open/${target}`;
}
