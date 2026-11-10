import { Pill } from "./ui";

/** No-photo fallback: the shop's initial, set in the display serif on a sunk tile. */
export function Monogram({ name, className = "" }: { name: string; className?: string }) {
  const letter = name.trim().charAt(0).toUpperCase() || "L";
  return (
    <div aria-hidden="true" className={`flex items-center justify-center rounded-tile bg-green-wash font-display text-green ${className}`}>
      {letter}
    </div>
  );
}

export function ShopHeader({ name, place }: { name: string; place?: string }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-4">
      <Monogram name={name} className="h-16 w-16 shrink-0 text-[2.25rem]" />
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
