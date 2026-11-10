import type { ReactNode } from "react";

type Tone = "green" | "ochre" | "clay" | "muted";

const PILL_TONES: Record<Tone, string> = {
  green: "bg-green-wash text-green",
  ochre: "bg-ochre-wash text-ink",
  clay: "bg-clay-wash text-clay",
  muted: "bg-canvas-sunk text-ink-muted",
};

/** Status pill: always a glyph AND a word, never color alone. */
export function Pill({ tone, glyph, children }: { tone: Tone; glyph: string; children: ReactNode }) {
  return (
    <span
      className={`num inline-flex h-7 items-center gap-1.5 rounded-pill px-3 text-label whitespace-nowrap uppercase ${PILL_TONES[tone]}`}
    >
      <span aria-hidden="true">{glyph}</span>
      {children}
    </span>
  );
}

export function Notice({ tone = "muted", children }: { tone?: Tone; children: ReactNode }) {
  const glyph = { green: "■", ochre: "◐", clay: "△", muted: "·" }[tone];
  const tones: Record<Tone, string> = {
    green: "bg-green-wash text-green",
    ochre: "bg-ochre-wash text-ink",
    clay: "bg-clay-wash text-clay",
    muted: "bg-canvas-sunk text-ink",
  };
  return (
    <div
      role={tone === "clay" ? "alert" : "status"}
      className={`flex gap-3 rounded-card px-4 py-3 text-body-s ${tones[tone]}`}
    >
      <span aria-hidden="true" className="num">{glyph}</span>
      <div>{children}</div>
    </div>
  );
}

export function Rule({ label }: { label?: string }) {
  if (!label) return <div className="dotted my-6" />;
  return (
    <div className="num my-6 flex items-center gap-3 text-label text-ink-muted uppercase">
      <span className="dotted flex-1" />
      {label}
      <span className="dotted flex-1" />
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-card border border-hairline bg-surface p-5 ${className}`}>{children}</section>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function CheckGlyph({ ok }: { ok: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <rect x="0.75" y="0.75" width="14.5" height="14.5" rx="3" fill="none"
        stroke={ok ? "var(--verify)" : "var(--clay)"} strokeWidth="1.5" />
      {ok ? (
        <path d="M4.5 8.2l2.3 2.3 4.7-5" fill="none" stroke="var(--verify)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M5 5l6 6M11 5l-6 6" stroke="var(--clay)" strokeWidth="1.6" strokeLinecap="round" />
      )}
    </svg>
  );
}
