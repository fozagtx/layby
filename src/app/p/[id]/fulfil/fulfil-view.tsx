"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useStored } from "@/lib/client/hooks";
import { Notice } from "@/components/ui";
import { formatDate, formatNim, shortHash, type Payment, type Plan, type Progress } from "@/lib/shared";

interface PlanData {
  plan: Plan;
  payments: Payment[];
  progress: Progress;
  isMerchant: boolean;
}

type Stage = "scan" | "manual" | "confirm" | "done";

// BarcodeDetector ships in Chromium-based Android WebViews; elsewhere we fall back to typing the code.
interface Detector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (opts: { formats: string[] }) => Detector;
  }
}

function parseCode(raw: string, planId: string) {
  const m = raw.trim().match(/^LAYBY:([a-z0-9]+):([A-Z0-9]{6})$/i);
  if (m) return m[1] === planId ? m[2].toUpperCase() : null;
  return /^[A-Z0-9]{6}$/i.test(raw.trim()) ? raw.trim().toUpperCase() : null;
}

export function FulfilView({ id }: { id: string }) {
  const token = useStored(`layby:manage:${id}`);
  const [data, setData] = useState<PlanData | null>(null);
  const [stage, setStage] = useState<Stage>("scan");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [camera, setCamera] = useState<"starting" | "on" | "unavailable">("starting");
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    fetch(`/api/plans/${id}`, { headers: { "x-manage-token": token }, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && d && setData(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id, token]);

  const accept = useCallback(
    (raw: string) => {
      const parsed = parseCode(raw, id);
      if (!parsed) {
        setError("That code isn't for this plan. Check it with the customer.");
        return false;
      }
      setCode(parsed);
      setError(null);
      setStage("confirm");
      return true;
    },
    [id],
  );

  // Camera + QR detection, only while scanning.
  useEffect(() => {
    if (stage !== "scan") return;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let alive = true;

    (async () => {
      if (!window.BarcodeDetector || !navigator.mediaDevices?.getUserMedia) {
        if (alive) setCamera("unavailable");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!alive || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        setCamera("on");
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        timer = setInterval(async () => {
          if (!video.current) return;
          const found = await detector.detect(video.current).catch(() => []);
          if (found[0] && alive && accept(found[0].rawValue) && timer) clearInterval(timer);
        }, 350);
      } catch {
        if (alive) setCamera("unavailable");
      }
    })();

    return () => {
      alive = false;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stage, accept]);

  async function markCollected() {
    if (!token) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/plans/${id}/collect`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-manage-token": token },
      body: JSON.stringify({ code }),
    }).catch(() => null);
    setSaving(false);
    if (res?.ok) return setStage("done");
    const body = await res?.json().catch(() => ({}));
    setError(body?.message ?? "Couldn't save. Check your connection and try again.");
  }

  if (!token) {
    return (
      <Notice tone="clay">
        This screen needs your private shop link. Open the link you copied when you created the plan, then come back here.
      </Notice>
    );
  }

  if (stage === "done") {
    return <Collected plan={data?.plan} />;
  }

  if (stage === "confirm") {
    return (
      <div className="fixed inset-0 z-40 flex items-end bg-[rgba(20,20,19,.32)]">
        <div className="sheet mx-auto w-full max-w-[420px] rounded-t-sheet bg-surface px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] shadow-lift">
          <div className="mx-auto mb-4 h-1 w-10 rounded-pill bg-hairline-firm" aria-hidden="true" />
          <div className="flex items-start gap-4">
            {data?.plan.hasPhoto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/plans/${id}/photo`} alt="" className="h-20 w-24 rounded-tile object-cover" />
            )}
            <div className="flex-1">
              <p className="font-display text-display-m">{data?.plan.item ?? "This plan"}</p>
              {data?.plan.customerName && <p className="text-body-s text-ink-muted">For {data.plan.customerName}</p>}
              <p className="num mt-1 text-label uppercase">Code {code}</p>
            </div>
            {data?.progress.fullyPaid && <span className="stamp text-green">Paid in full</span>}
          </div>
          {data && (
            <ul data-lenis-prevent className="num mt-4 max-h-40 space-y-1 overflow-auto text-amount-s">
              {data.payments.map((p) => (
                <li key={p.hash} className="flex justify-between text-ink-muted">
                  <span>{shortHash(p.hash)}</span>
                  <span>{formatNim(p.valueLuna)}</span>
                </li>
              ))}
            </ul>
          )}
          {error && <div className="mt-4"><Notice tone="clay">{error}</Notice></div>}
          <div className="mt-5 grid gap-2">
            <button className="btn btn-primary" onClick={markCollected} disabled={saving}>
              {saving ? <span className="working">Working</span> : "Mark as collected"}
            </button>
            <button className="btn btn-secondary" onClick={() => { setStage("scan"); setError(null); }}>Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-display-l">Scan the customer&apos;s collect code.</h1>

      {stage === "scan" && camera !== "unavailable" && (
        <div className="relative aspect-square overflow-hidden rounded-card bg-ink">
          <video ref={video} muted playsInline className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-[14%] rounded-card border-4 border-canvas" aria-hidden="true" />
          {camera === "starting" && (
            <p className="num absolute inset-x-0 bottom-4 text-center text-label text-canvas uppercase">Starting camera</p>
          )}
        </div>
      )}
      {stage === "scan" && camera === "unavailable" && (
        <Notice tone="muted">This phone&apos;s camera can&apos;t read codes here. Type the 6-character code from the customer&apos;s screen.</Notice>
      )}

      {(stage === "manual" || camera === "unavailable") && (
        <form onSubmit={(e) => { e.preventDefault(); accept(code); }} className="space-y-3">
          <label className="label" htmlFor="code">Collect code</label>
          <input id="code" className="field num text-center text-amount-m tracking-[0.3em] uppercase" maxLength={6}
            autoComplete="off" autoCapitalize="characters" value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} />
          <button className="btn btn-primary" disabled={code.length !== 6}>Check code</button>
        </form>
      )}

      {stage === "scan" && camera !== "unavailable" && (
        <button className="btn btn-secondary" onClick={() => setStage("manual")}>Enter code instead</button>
      )}
      {error && <Notice tone="clay">{error}</Notice>}
      <Link href={`/p/${id}`} className="btn btn-ghost">Back to the plan</Link>
    </div>
  );
}

function Collected({ plan }: { plan?: Plan }) {
  const [ready, setReady] = useState(false);
  // Hold for at least 2 seconds so both people at the counter can see it.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-green-wash px-5 text-center">
      <span className="stamp text-[1.75rem] text-green">Collected</span>
      {plan && <p className="font-display text-display-m">{plan.item}</p>}
      <p className="num text-amount-m">{formatDate(new Date().toISOString())}</p>
      <Link href={plan ? `/p/${plan.id}` : "/"} className={`btn btn-primary max-w-[380px] ${ready ? "" : "pointer-events-none opacity-0"}`}>
        Done
      </Link>
    </div>
  );
}
