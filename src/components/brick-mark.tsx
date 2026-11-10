/**
 * Three-brick stack: the Layby mark. DESIGN.md §3.
 * `animate` plays once: the bricks stack bottom-up, then the dashed top brick fills, like a last payment landing.
 */
export function BrickMark({ size = 22, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true" className={animate ? "mark-live" : undefined}>
      <rect className="mark-b1" x="1" y="14" width="20" height="6" rx="1.5" fill="var(--green)" />
      <rect className="mark-b2" x="4" y="7.5" width="14" height="5" rx="1.5" fill="var(--green)" />
      <rect className="mark-b3" x="7" y="1.5" width="8" height="4.5" rx="1.5" fill="none" stroke="var(--ochre)" strokeWidth="1.5" strokeDasharray="2 1.5" />
      {animate && <rect className="mark-fill" x="6.2" y="0.7" width="9.6" height="6.1" rx="2" fill="var(--green)" />}
    </svg>
  );
}
