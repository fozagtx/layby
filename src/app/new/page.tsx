"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { local, useHost, walletErrorMessage } from "@/lib/client/nimiq";
import { useToday } from "@/lib/client/hooks";
import { resizePhoto } from "@/lib/client/photo";
import { NetworkPill } from "@/components/network-badge";
import { PlanProgress } from "@/components/plan-progress";
import { Notice } from "@/components/ui";
import {
  CURRENCIES,
  LUNA_PER_NIM,
  POLICY_PRESETS,
  computeProgress,
  formatAddress,
  formatMoney,
  formatNim,
  isValidNimiqAddress,
  type Cadence,
  type Currency,
  type Network,
  type Plan,
} from "@/lib/shared";

const CADENCES: { id: Cadence; label: string }[] = [
  { id: "weekly", label: "Weekly" },
  { id: "biweekly", label: "2 weeks" },
  { id: "monthly", label: "Monthly" },
];

export default function NewPlan() {
  const host = useHost();
  const router = useRouter();
  const today = useToday();

  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [merchantName, setMerchantName] = useState("");
  const [shopPlace, setShopPlace] = useState("");
  const [merchantAddress, setMerchantAddress] = useState("");
  const [item, setItem] = useState("");
  const [price, setPrice] = useState("");
  const [currencyChoice, setCurrency] = useState<Currency | null>(null);
  const [installments, setInstallments] = useState(4);
  const [cadence, setCadence] = useState<Cadence>("weekly");
  const [startChoice, setStartDate] = useState<string | null>(null);
  const [collectBy, setCollectBy] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [policyId, setPolicyId] = useState<string>("");
  const [customPolicy, setCustomPolicy] = useState("");
  const [browserNetwork, setBrowserNetwork] = useState<Network>("testnet");
  const [rate, setRate] = useState<{ value: number; at: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Until the shop picks, default to Nimiq Pay's fiat and today's date.
  const currency: Currency = currencyChoice ?? (host.status === "checking" ? "USD" : host.fiat);
  const startDate = startChoice ?? today;
  const network: Network = host.status === "inside" ? host.network : browserNetwork;
  const priceNumber = Number(price);
  const addressOk = isValidNimiqAddress(merchantAddress);
  const policy =
    policyId === "custom" ? customPolicy.trim() : (POLICY_PRESETS.find((p) => p.id === policyId)?.text ?? "");

  useEffect(() => {
    if (currency === "NIM") return;
    let alive = true;
    fetch(`/api/quote?currency=${currency}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => alive && b && setRate({ value: b.rate, at: b.at }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [currency]);

  // Live brick preview: teaches the metaphor while the shop picks the number of installments.
  const preview = useMemo(() => {
    const start = startDate || "2026-01-01";
    const p = { price: priceNumber > 0 ? priceNumber : 100, installments, cadence, startDate: start } as Plan;
    // A fixed "now" keeps this pure (and prerenderable); the preview only needs amounts and dates.
    return computeProgress(p, [], new Date(`${start}T00:00:00Z`));
  }, [priceNumber, installments, cadence, startDate]);

  const nimTotal = priceNumber > 0 ? (currency === "NIM" ? priceNumber : rate ? priceNumber / rate.value : null) : null;

  async function onPhoto(file: File | undefined) {
    setPhotoError(null);
    if (!file) return;
    try {
      setPhoto(await resizePhoto(file));
    } catch (e) {
      setPhotoError((e as Error).message);
    }
  }

  async function useWallet() {
    if (!host.provider) return;
    setError(null);
    try {
      const [wallet] = await host.provider.listAccounts();
      setMerchantAddress(formatAddress(wallet));
    } catch (e) {
      setError(walletErrorMessage(e).message);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!addressOk) return setError("Add the shop's Nimiq wallet. Payments go to it.");
    if (!(priceNumber > 0)) return setError("Enter the item's price.");
    if (!startDate) return setError("Pick the date the first payment is due.");
    if (!policy) return setError("Choose a refund policy. Customers see it on the plan.");

    setSaving(true);
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          network, merchantName, merchantAddress, shopPlace, item, itemPhoto: photo, note, customerName,
          price: priceNumber, currency, installments, cadence, startDate, collectBy: collectBy || null, policy,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.issues?.join(", ") ?? "Couldn't create the plan. Try again.");
      local.set(`layby:manage:${body.id}`, body.manageToken);
      router.push(`/p/${body.id}?t=${encodeURIComponent(body.manageToken)}&created=1`);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <div className="flex items-start justify-between gap-3 pt-2">
        <h1 className="font-display text-display-l">Set up a layby.</h1>
        <NetworkPill network={network} />
      </div>

      {/* 1. Item photo, camera first */}
      <div>
        <span className="label">Item photo</span>
        <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-tile border-2 border-dashed border-hairline-firm bg-surface text-center">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Item preview" className="h-full w-full object-cover" />
          ) : (
            <>
              <span className="num text-label text-ink-muted uppercase">Take or choose a photo</span>
              <span className="mt-1 text-body-s text-ink-faint">Optional. Helps the customer know it&apos;s theirs.</span>
            </>
          )}
          <input type="file" accept="image/*" capture="environment" className="sr-only"
            onChange={(e) => onPhoto(e.target.files?.[0])} />
        </label>
        {photo && (
          <button type="button" className="btn btn-ghost mt-1" onClick={() => setPhoto(null)}>Remove photo</button>
        )}
        {photoError && <p className="mt-2 text-body-s text-clay">△ {photoError}</p>}
      </div>

      {/* 2. Item and price */}
      <div className="space-y-5">
        <div>
          <label className="label" htmlFor="item">What is it</label>
          <input id="item" className="field" required maxLength={80} placeholder="Singer sewing machine"
            value={item} onChange={(e) => setItem(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="price">Price</label>
          <div className="flex gap-2">
            <input id="price" className="field num flex-1 text-right" required inputMode="decimal" placeholder="185,000"
              value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} />
            <select aria-label="Currency" className="field num w-28" value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {nimTotal !== null && currency !== "NIM" ? (
            <p className="num mt-2 text-amount-s text-ink-muted">
              ≈ {formatNim(Math.round(nimTotal * LUNA_PER_NIM), 4)} today · rate{" "}
              {new Date(rate!.at).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
            </p>
          ) : (
            <p className="mt-2 text-body-s text-ink-muted">
              Price it in the money you think in. Customers pay in NIM at the rate on the day.
            </p>
          )}
        </div>
      </div>

      {/* 3. Installments with live brick preview */}
      <div>
        <span className="label">Installments</span>
        <div className="flex items-center gap-3">
          <button type="button" className="btn btn-secondary w-14! px-0!" aria-label="Fewer installments"
            onClick={() => setInstallments((n) => Math.max(1, n - 1))}>−</button>
          <output className="num flex-1 text-center text-amount-hero" aria-live="polite">{installments}</output>
          <button type="button" className="btn btn-secondary w-14! px-0!" aria-label="More installments"
            onClick={() => setInstallments((n) => Math.min(24, n + 1))}>+</button>
        </div>
        <div className="mt-4">
          <PlanProgress schedule={preview.schedule} />
        </div>
        {priceNumber > 0 ? (
          <p className="num mt-2 text-amount-m">{installments} × {formatMoney(preview.installmentAmount, currency)}</p>
        ) : (
          <p className="mt-2 text-body-s text-ink-muted">Enter a price to see each payment.</p>
        )}
        <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="How often">
          {CADENCES.map((c) => (
            <button key={c.id} type="button" role="radio" aria-checked={cadence === c.id}
              className={`btn ${cadence === c.id ? "btn-primary" : "btn-secondary"} px-2!`}
              onClick={() => setCadence(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="startDate">First payment</label>
          <input id="startDate" type="date" className="field num" value={startDate}
            onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="collectBy">Collect by</label>
          <input id="collectBy" type="date" className="field num" value={collectBy} min={startDate}
            onChange={(e) => setCollectBy(e.target.value)} />
        </div>
      </div>

      {/* 5. Refund policy: required, shown verbatim to the customer */}
      <fieldset>
        <legend className="label">Refund policy</legend>
        <div className="space-y-2">
          {[...POLICY_PRESETS, { id: "custom", label: "Write my own", text: "" }].map((p) => (
            <label key={p.id}
              className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-input border px-4 py-3 ${policyId === p.id ? "border-green bg-green-wash" : "border-hairline-firm bg-surface"}`}>
              <input type="radio" name="policy" value={p.id} checked={policyId === p.id}
                onChange={() => setPolicyId(p.id)} className="mt-1.5 accent-[var(--green)]" />
              <span>
                <span className="block font-medium">{p.label}</span>
                {p.text && <span className="block text-body-s text-ink-muted">{p.text}</span>}
              </span>
            </label>
          ))}
        </div>
        {policyId === "custom" && (
          <textarea className="field mt-2 min-h-24" maxLength={400} placeholder="In plain words, what happens if the customer cancels?"
            value={customPolicy} onChange={(e) => setCustomPolicy(e.target.value)} />
        )}
      </fieldset>

      {/* 6. Shop and customer */}
      <div className="space-y-5">
        <div>
          <label className="label" htmlFor="merchantName">Shop name</label>
          <input id="merchantName" className="field" required maxLength={60} placeholder="Mama Ngozi Fabrics"
            value={merchantName} onChange={(e) => setMerchantName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="shopPlace">Where is the shop</label>
          <input id="shopPlace" className="field" maxLength={60} placeholder="Balogun Market, Lagos"
            value={shopPlace} onChange={(e) => setShopPlace(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="merchantAddress">Shop wallet</label>
          {host.status === "inside" && (
            <button type="button" className="btn btn-secondary mb-2" onClick={useWallet}>Use my Nimiq Pay wallet</button>
          )}
          <input id="merchantAddress" className="field num text-amount-s" required placeholder="NQ.. .... .... ...."
            aria-invalid={merchantAddress !== "" && !addressOk}
            value={merchantAddress} onChange={(e) => setMerchantAddress(e.target.value)} />
          {merchantAddress && !addressOk && <p className="mt-2 text-body-s text-clay">△ That address doesn&apos;t look right. Check it again.</p>}
        </div>
        <div>
          <label className="label" htmlFor="customerName">Customer name</label>
          <input id="customerName" className="field" maxLength={60} placeholder="Optional"
            value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="note">Note for the customer</label>
          <input id="note" className="field" maxLength={280} placeholder="Optional. Comes with pedal and cover."
            value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {host.status === "outside" && (
          <div>
            <label className="label" htmlFor="network">Network</label>
            <select id="network" className="field" value={browserNetwork} onChange={(e) => setBrowserNetwork(e.target.value as Network)}>
              <option value="testnet">Testnet (free test NIM)</option>
              <option value="mainnet">Mainnet (real NIM)</option>
            </select>
            <p className="mt-2 text-body-s text-ink-muted">Inside Nimiq Pay this follows the app&apos;s network.</p>
          </div>
        )}
      </div>

      {error && <Notice tone="clay">{error}</Notice>}

      <div className="sticky bottom-0 -mx-5 border-t border-hairline bg-canvas px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <span className="working">Working</span> : "Create plan"}
        </button>
      </div>
    </form>
  );
}
