import { Pill } from "./ui";

/** Woodcut-register line drawing of a shopfront: black line art, no color. DESIGN.md §5.4 fallback. */
export function Shopfront({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 90" className={className} aria-hidden="true" fill="none" stroke="var(--ink)" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
      <path d="M14 84V34h132v50" />
      <path d="M8 84h144" />
      <path d="M10 34l8-16h124l8 16" />
      <path d="M18 34c0 5 4 8 9 8s9-3 9-8c0 5 4 8 9 8s9-3 9-8c0 5 4 8 9 8s9-3 9-8c0 5 4 8 9 8s9-3 9-8c0 5 4 8 9 8s9-3 9-8c0 5 4 8 9 8s9-3 9-8c0 5 4 8 9 8s9-3 9-8" />
      <path d="M30 18V10h100v8" />
      <path d="M58 14h44" strokeWidth="2" />
      <rect x="26" y="52" width="40" height="32" />
      <path d="M46 52v32M26 66h40" />
      <rect x="84" y="50" width="26" height="34" />
      <circle cx="105" cy="68" r="1.4" fill="var(--ink)" />
      <path d="M120 84V60h18v24M120 66h18M120 72h18M120 78h18" />
      <path d="M30 62h4M52 58l6 4M34 76l4-3" strokeWidth="1" />
    </svg>
  );
}

export function ShopHeader({ name, place }: { name: string; place?: string }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-4">
      <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-tile bg-canvas-sunk p-2">
        <Shopfront className="h-full w-full" />
      </div>
      <div className="min-w-0">
        <p className="font-display text-display-m truncate">{name}</p>
        {place && <p className="text-body-s text-ink-muted truncate">{place}</p>}
        <div className="mt-1">
          <Pill tone="green" glyph="✓">Verified on-chain</Pill>
        </div>
      </div>
    </div>
  );
}
