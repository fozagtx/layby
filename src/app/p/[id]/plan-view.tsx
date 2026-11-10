"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { local, openInNimiqPayUrl, useHost, walletErrorMessage, type Host } from "@/lib/client/nimiq";
import { useOrigin, useStored } from "@/lib/client/hooks";
import { NetworkPill } from "@/components/network-badge";
import { PlanProgress } from "@/components/plan-progress";
import { ShopHeader } from "@/components/shop-header";
import { HonestyBlock } from "@/components/honesty";
import { Qr } from "@/components/qr";
import { Card, Notice, Pill, Rule, Skeleton } from "@/components/ui";
import {
  LUNA_PER_NIM,
  formatDate,
  formatMoney,
  formatNim,
  memoFor,
  paymentsByStep,
  shortHash,
  type Payment,
  type Plan,
  type Progress,
} from "@/lib/shared";

interface PlanData {
  plan: Plan;
  payments: Payment[];
  progress: Progress;
  isMerchant: boolean;
  collectCode: string | null;
}

type PayState =
  | { step: "idle" }
  | { step: "wallet" }
  | { step: "checking"; hash: string }
  | { step: "unknown"; message: string }
  | { step: "error"; message: string };

const POLL_MS = 3000;
const POLL_TRIES = 20;
const cacheKey = (id: string) => `layby:plan:${id}`;

export function PlanView({ id }: { id: string }) {
  const search = useSearchParams();
  const host = useHost();
  const router = useRouter();
  const fromUrl = search.get("t");
  const stored = useStored(`layby:manage:${id}`);
  const token = fromUrl ?? stored;
  const created = search.get("created") === "1";
  const cached = useStored(cacheKey(id));

  const [data, setData] = useState<PlanData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (fromUrl) local.set(`layby:manage:${id}`, fromUrl);
  }, [id, fromUrl]);

  const fetchPlan = useCallback(async (): Promise<PlanData | string> => {
    try {
      const res = await fetch(`/api/plans/${id}`, { headers: token ? { "x-manage-token": token } : {}, cache: "no-store" });
      if (res.status === 404) return "We couldn't find this plan. Check the link with the shop.";
      if (!res.ok) throw new Error();
      return (await res.json()) as PlanData;
    } catch {
      return "Couldn't reach Layby. Showing the last saved copy; we'll keep trying.";
    }
  }, [id, token]);

  const load = useCallback(
    () =>
      fetchPlan().then((result) => {
        if (typeof result === "string") return setLoadError(result);
        setData(result);
        setLoadError(null);
        // Offline copy, so the plan still opens on a bad connection. Never holds the shop token.
        local.set(cacheKey(id), JSON.stringify({ ...result, isMerchant: false }));
      }),
    [fetchPlan, id],
  );

  useEffect(() => {
    load();
    const timer = setInterval(() => document.visibilityState === "visible" && load(), 15_000);
    return () => clearInterval(timer);
  }, [load]);

  const shown: PlanData | null = data ?? (cached ? (JSON.parse(cached) as PlanData) : null);

  if (!shown) {
    if (loadError) return <Notice tone="clay">{loadError}</Notice>;
    return <PlanSkeleton />;
  }

  const { plan, payments, progress, isMerchant, collectCode } = shown;
  const byStep = paymentsByStep(progress.schedule, payments);
  const paidCount = progress.schedule.filter((s) => s.covered).length;
  const selectedStep = selected !== null ? progress.schedule[selected] : null;

  function onBrick(i: number) {
    const payment = byStep[i];
    if (payment) router.push(`/r/${payment.hash}`);
    else setSelected(i === selected ? null : i);
  }

  return (
    <div className="space-y-6">
      {created && isMerchant && (
        <Notice tone="green">Plan created. Show the QR below to {plan.customerName || "your customer"}, or send the link.</Notice>
      )}
      {loadError && data === null && <Notice tone="ochre">{loadError}</Notice>}

      <div className="flex items-start justify-between gap-3">
        <ShopHeader name={plan.merchantName} place={plan.shopPlace} />
        {/* Inside Nimiq Pay the header already flags testnet; in a browser, flag a test plan here instead. */}
        {host.status !== "inside" && (
          <div className="shrink-0">
            <NetworkPill network={plan.network} />
          </div>
        )}
      </div>

      {plan.hasPhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/plans/${plan.id}/photo`} alt={plan.item} className="aspect-[4/3] w-full rounded-tile object-cover" />
      )}

      <div>
        <h1 className="font-display text-display-m">{plan.item}</h1>
        {plan.customerName && <p className="text-body-s text-ink-muted">Held for {plan.customerName}</p>}
        {plan.note && <p className="mt-1 text-body-s text-ink-muted">{plan.note}</p>}
      </div>

      <div className="relative">
        <p className="num text-amount-hero">{formatMoney(progress.paid, plan.currency)}</p>
        <p className="num text-amount-s text-ink-muted">of {formatMoney(plan.price, plan.currency)} paid</p>
        {(plan.status === "collected" || progress.fullyPaid) && (
          <div className="absolute top-0 right-0">
            <span className="stamp text-green">{plan.status === "collected" ? "Collected" : "Paid in full"}</span>
          </div>
        )}
      </div>

      <PlanProgress schedule={progress.schedule} onSelect={onBrick} />
      {selectedStep && !selectedStep.covered && (
        <p className="num -mt-3 text-amount-s text-ink-muted" aria-live="polite">
          Payment {selectedStep.index} · {formatMoney(selectedStep.amount, plan.currency)} · due {formatDate(selectedStep.date)}
        </p>
      )}

      {plan.status === "collected" ? (
        <Card className="bg-green-wash text-center">
          <p className="text-body">Collected on <span className="num">{plan.collectedAt ? formatDate(plan.collectedAt) : ""}</span>. Enjoy it.</p>
        </Card>
      ) : progress.fullyPaid ? (
        collectCode && <CollectCode plan={plan} code={collectCode} />
      ) : (
        plan.status === "active" && (
          <>
            {progress.behindBy > 0 && (
              <Notice tone="clay">
                <span className="num">{formatMoney(progress.behindBy, plan.currency)}</span> was due by{" "}
                <span className="num">{formatDate(progress.schedule.filter((s) => !s.covered)[0]?.date ?? plan.startDate)}</span>.
              </Notice>
            )}
            <NextPayment plan={plan} progress={progress} host={host} onPaid={(hash) => router.push(`/r/${hash}?from=pay`)} reload={load} />
          </>
        )
      )}

      {/* Memo disclosure: always visible, never collapsed */}
      <MemoLine memo={memoFor(plan.id)} />

      {isMerchant && token && <ShopPanel plan={plan} progress={progress} token={token} />}

      <Rule label={`Payments · ${paidCount} of ${plan.installments}`} />
      {payments.length === 0 ? (
        <p className="text-center text-body-s text-ink-muted">No payments yet. The first one fills the first brick.</p>
      ) : (
        <ul className="overflow-hidden rounded-card border border-hairline bg-surface">
          {payments.map((p, i) => (
            <li key={p.hash} className={i > 0 ? "dotted" : ""}>
              <Link href={`/r/${p.hash}`} className="num flex min-h-14 items-center gap-3 px-4 py-3">
                <span className="text-ink-muted">{formatDate(p.paidAt)}</span>
                <span className="flex-1 text-right">
                  <span className="block text-amount-s">{formatNim(p.valueLuna)}</span>
                  {plan.currency !== "NIM" && (
                    <span className="block text-caption text-ink-muted">{formatMoney(p.fiatValue, plan.currency)}</span>
                  )}
                </span>
                <span className="text-verify" aria-label="Checked on chain">✓</span>
                <span className="text-ink-faint" aria-hidden="true">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Rule label="Schedule" />
      <ol className="num space-y-2 text-amount-s">
        {progress.schedule.map((s) => (
          <li key={s.index} className="flex items-center justify-between">
            <span className={s.covered ? "text-ink-muted" : ""}>{String(s.index).padStart(2, "0")} · {formatDate(s.date)}</span>
            <span>
              {formatMoney(s.amount, plan.currency)}{" "}
              <span className={s.covered ? "text-verify" : "text-ink-faint"}>{s.covered ? "■ paid" : "□"}</span>
            </span>
          </li>
        ))}
      </ol>
      {plan.collectBy && (
        <p className="num text-amount-s text-ink-muted">Collect by {formatDate(plan.collectBy)}</p>
      )}

      <Rule label="Shop's refund policy" />
      <p className="rounded-card bg-canvas-sunk p-4 text-body-s">{plan.policy || "The shop hasn't written a refund policy."}</p>

      <HonestyBlock />
    </div>
  );
}

function MemoLine({ memo }: { memo: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-card border border-hairline bg-surface px-4 py-3">
      <div className="num flex items-center gap-3 text-amount-s">
        <span className="text-label text-ink-muted uppercase">Memo</span>
        <span className="flex-1">{memo}</span>
        <button type="button" className="rounded-pill border border-hairline-firm px-3 py-1.5 text-label uppercase"
          onClick={() => navigator.clipboard?.writeText(memo).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {})}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-1 text-body-s text-ink-muted">This tag is how we match your payment to this plan.</p>
    </div>
  );
}

function NextPayment({
  plan,
  progress,
  host,
  onPaid,
  reload,
}: {
  plan: Plan;
  progress: Progress;
  host: Host;
  onPaid: (hash: string) => void;
  reload: () => void;
}) {
  const suggested = Math.min(progress.remaining, progress.nextDue?.amount ?? progress.remaining);
  const [custom, setCustom] = useState<string | null>(null);
  const [quote, setQuote] = useState<{ rate: number; token: string; at: string; expiresAt: number } | null>(null);
  const [quoteError, setQuoteError] = useState(false);
  const [pay, setPay] = useState<PayState>({ step: "idle" });
  const polling = useRef(true);

  const fetchQuote = useCallback(async () => {
    try {
      const res = await fetch(`/api/quote?currency=${plan.currency}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const b = await res.json();
      return { rate: Number(b.rate), token: String(b.quote), at: String(b.at), expiresAt: Number(b.expiresAt) };
    } catch {
      return null;
    }
  }, [plan.currency]);

  const refreshQuote = useCallback(
    () =>
      fetchQuote().then((q) => {
        setQuote(q);
        setQuoteError(!q);
        return q;
      }),
    [fetchQuote],
  );

  useEffect(() => {
    refreshQuote();
    polling.current = true;
    return () => {
      polling.current = false;
    };
  }, [refreshQuote]);

  const amount = custom === null ? suggested : Number(custom);
  const valid = amount > 0 && amount <= progress.remaining + 0.005;
  const luna = quote && valid ? Math.ceil((amount / quote.rate) * LUNA_PER_NIM) : null;

  async function verify(hash: string, quoteToken: string) {
    setPay({ step: "checking", hash });
    for (let i = 0; i < POLL_TRIES && polling.current; i++) {
      try {
        const res = await fetch(`/api/plans/${plan.id}/payments`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ hash, quote: quoteToken }),
        });
        if (res.ok) return onPaid(hash);
        if (res.status !== 202) {
          const body = await res.json().catch(() => ({}));
          return setPay({ step: "error", message: body.message ?? "This payment couldn't be counted." });
        }
      } catch {
        /* network blip: keep trying */
      }
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
    reload();
    setPay({ step: "unknown", message: "Sent, but the network hasn't confirmed it yet. Don't pay again. This page keeps checking and the payment will appear." });
  }

  async function payNow() {
    if (!host.provider || !valid) return;
    // Re-quote if the shown rate is older than its 10-minute lock.
    const q = quote && quote.expiresAt - Date.now() > 60_000 ? quote : await refreshQuote();
    if (!q) return;
    const value = Math.ceil((amount / q.rate) * LUNA_PER_NIM);
    setPay({ step: "wallet" });
    try {
      const hash = await host.provider.sendBasicTransactionWithData({ recipient: plan.merchantAddress, value, data: memoFor(plan.id) });
      await verify(hash, q.token);
    } catch (e) {
      const err = walletErrorMessage(e);
      if (err.kind === "cancelled") setPay({ step: "idle" });
      else setPay({ step: err.kind === "unknown" ? "unknown" : "error", message: err.message });
    }
  }

  const busy = pay.step === "wallet" || pay.step === "checking";
  const wrongNetwork = host.status === "inside" && host.network !== plan.network;

  return (
    <Card className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="num text-label text-ink-muted uppercase">{custom === null ? "Next payment" : "Your amount"}</span>
        {progress.nextDue && <span className="num text-label text-ink-muted uppercase">Due {formatDate(progress.nextDue.date)}</span>}
      </div>

      {custom === null ? (
        <p className="num text-amount-hero">{formatMoney(suggested, plan.currency)}</p>
      ) : (
        <div className="flex gap-2">
          <input aria-label={`Amount in ${plan.currency}`} className="field num flex-1 text-right text-amount-m" inputMode="decimal"
            value={custom} disabled={busy} onChange={(e) => setCustom(e.target.value.replace(/[^\d.]/g, ""))} />
          <span className="num flex items-center rounded-input bg-canvas-sunk px-3 text-label">{plan.currency}</span>
        </div>
      )}

      <p className="num text-amount-s text-ink-muted" aria-live="polite">
        {!valid
          ? `Enter an amount up to ${formatMoney(progress.remaining, plan.currency)}.`
          : luna !== null && quote
            ? plan.currency === "NIM"
              ? `${formatNim(luna, 4)}`
              : `= ${formatNim(luna, 4)} · rate locked 10 min · ${new Date(quote.at).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}`
            : quoteError
              ? "Couldn't get today's NIM price. Try again in a moment."
              : "Getting today's NIM price…"}
      </p>

      {host.status === "outside" ? (
        <>
          <a href={openInNimiqPayUrl()} className="btn btn-accent">Open in Nimiq Pay</a>
          <p className="text-center text-body-s text-ink-muted">Paying happens in the Nimiq Pay app. On a computer, scan the shop&apos;s QR with your phone.</p>
        </>
      ) : wrongNetwork ? (
        <Notice tone="ochre">
          This plan is on Nimiq {plan.network}, but your Nimiq Pay is on {host.network}. Switch networks in Nimiq Pay to pay it.
        </Notice>
      ) : (
        <>
          <button className="btn btn-accent" disabled={!valid || !luna || busy || host.status !== "inside"} onClick={payNow}>
            {pay.step === "wallet" ? <span className="working">Approve in Nimiq Pay</span>
              : pay.step === "checking" ? <span className="working">Checking on-chain</span>
              : luna ? `Pay ${formatNim(luna)}` : "Pay"}
          </button>
          {(!valid || !luna) && pay.step === "idle" && (
            <p className="-mt-2 text-center text-body-s text-ink-muted">{!valid ? "Check the amount above." : "Waiting for today's price."}</p>
          )}
        </>
      )}

      <button type="button" className="btn btn-ghost" disabled={busy}
        onClick={() => setCustom(custom === null ? String(suggested) : null)}>
        {custom === null ? "Pay a different amount" : "Pay the next payment instead"}
      </button>

      {pay.step === "checking" && (
        <Notice tone="muted">
          <span className="inline-flex items-center gap-2"><span className="pulse-dot" /> Sent. Checking it on the Nimiq chain, usually a few seconds.</span>
          <span className="num mt-1 block text-caption text-ink-muted">{shortHash(pay.hash)}</span>
        </Notice>
      )}
      {pay.step === "unknown" && <Notice tone="ochre">{pay.message}</Notice>}
      {pay.step === "error" && <Notice tone="clay">{pay.message}</Notice>}
    </Card>
  );
}

function CollectCode({ plan, code }: { plan: Plan; code: string }) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-card bg-surface p-6 text-center shadow-lift">
      <p className="font-display text-display-m">{plan.merchantName}</p>
      <Qr value={`LAYBY:${plan.id}:${code}`} size={280} label="Collect code for the shop to scan" />
      <p className="text-body">Show this to the shop.</p>
      <p className="num text-amount-m tracking-[0.3em]" aria-label={`Collect code ${code.split("").join(" ")}`}>{code}</p>
      <p className="text-body-s text-ink-muted">If the camera can&apos;t read it, read this code out.</p>
    </section>
  );
}

function ShopPanel({ plan, progress, token }: { plan: Plan; progress: Progress; token: string }) {
  const origin = useOrigin();
  const [copied, setCopied] = useState<string | null>(null);
  const shareUrl = `${origin}/p/${plan.id}`;
  const manageUrl = `${shareUrl}?t=${encodeURIComponent(token)}`;
  const shareText = `${plan.merchantName}: your layby for ${plan.item}. Pay in NIM here: ${shareUrl}`;

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied("Couldn't copy. Long-press the link instead.");
    }
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: plan.item, text: shareText, url: shareUrl }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
    }
  }

  return (
    <section className="space-y-4 rounded-card border-2 border-ink bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="num text-label tracking-[0.14em] uppercase">Shop view</p>
        <Pill tone="muted" glyph="⌐">Only you see this</Pill>
      </div>

      {plan.status === "active" && progress.fullyPaid && (
        <Link href={`/p/${plan.id}/fulfil`} className="btn btn-primary">Hand over the item</Link>
      )}

      {plan.status === "active" && !progress.fullyPaid && (
        <>
          <div className="flex justify-center rounded-card bg-surface p-2 shadow-lift">
            {origin && <Qr value={shareUrl} size={240} label="QR code for the customer to open this plan" />}
          </div>
          <p className="text-center text-body-s text-ink-muted">The customer scans this to open the plan and pay.</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn btn-secondary" onClick={share}>Share</button>
            <button type="button" className="btn btn-secondary" onClick={() => copy(shareUrl, "Link copied")}>Copy link</button>
          </div>
        </>
      )}

      <div className="dotted pt-4">
        <p className="text-body-s text-ink-muted">Your private shop link is the only way to hand this item over. Keep it; don&apos;t share it.</p>
        <button type="button" className="btn btn-secondary mt-3" onClick={() => copy(manageUrl, "Shop link copied")}>Copy my shop link</button>
      </div>
      {copied && <p className="num text-center text-label text-green uppercase" role="status">{copied}</p>}
      <Link href="/new" className="btn btn-ghost">Start another plan</Link>
    </section>
  );
}

function PlanSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading plan">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-20" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-11 w-1/2" />
      <div className="flex gap-1">
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-8 flex-1" />)}
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
