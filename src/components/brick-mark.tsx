/** Three-brick stack: the Layby mark. DESIGN.md §3. */
export function BrickMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
      <rect x="1" y="14" width="20" height="6" rx="1.5" fill="var(--green)" />
      <rect x="4" y="7.5" width="14" height="5" rx="1.5" fill="var(--green)" />
      <rect x="7" y="1.5" width="8" height="4.5" rx="1.5" fill="none" stroke="var(--ochre)" strokeWidth="1.5" strokeDasharray="2 1.5" />
    </svg>
  );
}
