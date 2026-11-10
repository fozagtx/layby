/**
 * Landing hero art: a flagship phone on layby. Back view (triple camera) behind, front view showing Layby.
 * Original drawing, no product photography. The Layby mark on the screen plays its stack-and-fill once.
 */
export function PhoneArt({ paidCount, total = 8, className = "" }: { paidCount: number; total?: number; className?: string }) {
  const brickW = 8.2;
  const gap = 1.6;
  const startX = 50 - (total * brickW + (total - 1) * gap) / 2;

  return (
    <svg viewBox="0 0 320 230" className={className} role="img" aria-label="A phone reserved on layby, 4 of 8 payments made">
      {/* Shadow on the counter */}
      <ellipse cx="166" cy="220" rx="118" ry="6" fill="var(--hairline)" />

      {/* Back of the phone: titanium body, camera plateau with three lenses */}
      <g transform="translate(62 22) rotate(-9)">
        <rect width="98" height="196" rx="20" fill="var(--ink)" />
        <rect x="1.5" y="1.5" width="95" height="193" rx="18.5" fill="none" stroke="var(--ink-muted)" strokeOpacity=".5" />
        <rect x="9" y="9" width="54" height="54" rx="14" fill="#24221e" stroke="var(--ink-muted)" strokeOpacity=".45" />
        {[
          [24, 24],
          [24, 48],
          [47, 36],
        ].map(([cx, cy]) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r="10" fill="#0b0b0a" stroke="#4a4740" strokeWidth="2" />
            <circle cx={cx} cy={cy} r="4.5" fill="#1a2630" />
            <circle cx={cx - 1.5} cy={cy - 1.5} r="1.3" fill="#9fb3c2" opacity=".7" />
          </g>
        ))}
        <circle cx="49" cy="17" r="3" fill="#d9d3c6" opacity=".8" />
        <circle cx="49" cy="55" r="2" fill="#0b0b0a" />
      </g>

      {/* Front of the phone: Layby open on the screen */}
      <g transform="translate(150 14) rotate(6)">
        <rect width="104" height="206" rx="21" fill="var(--ink)" />
        <rect x="5" y="5" width="94" height="196" rx="17" fill="var(--canvas)" />
        <rect x="38" y="11" width="28" height="8" rx="4" fill="var(--ink)" />

        <svg x="40" y="30" width="24" height="24" viewBox="0 0 22 22" className="mark-live" aria-hidden="true">
          <rect className="mark-b1" x="1" y="14" width="20" height="6" rx="1.5" fill="var(--green)" />
          <rect className="mark-b2" x="4" y="7.5" width="14" height="5" rx="1.5" fill="var(--green)" />
          <rect className="mark-b3" x="7" y="1.5" width="8" height="4.5" rx="1.5" fill="none" stroke="var(--ochre)" strokeWidth="1.5" strokeDasharray="2 1.5" />
          <rect className="mark-fill" x="6.2" y="0.7" width="9.6" height="6.1" rx="2" fill="var(--green)" />
        </svg>
        <text x="52" y="70" textAnchor="middle" fontSize="13" fill="var(--ink)" style={{ fontFamily: "var(--font-display)" }}>
          Layby
        </text>
        <text x="52" y="92" textAnchor="middle" fontSize="6.5" letterSpacing=".6" fill="var(--ink-muted)" style={{ fontFamily: "var(--font-mono)" }}>
          PRO MAX · 256GB
        </text>

        <g transform="translate(2 104)">
          {Array.from({ length: total }, (_, i) => {
            const paid = i < paidCount;
            const next = i === paidCount;
            return (
              <rect
                key={i}
                x={startX + i * (brickW + gap)}
                y="0"
                width={brickW}
                height="14"
                rx="1.6"
                fill={paid ? "var(--green)" : "none"}
                stroke={paid ? "var(--green)" : next ? "var(--ochre)" : "var(--hairline-firm)"}
                strokeWidth={next ? 1.1 : 0.8}
                strokeDasharray={next ? "2 1.4" : undefined}
                className={paid && i === paidCount - 1 ? "brick-pop" : undefined}
              />
            );
          })}
        </g>
        <text x="52" y="134" textAnchor="middle" fontSize="6.5" letterSpacing=".6" fill="var(--ink-muted)" style={{ fontFamily: "var(--font-mono)" }}>
          {paidCount} OF {total} PAID
        </text>

        <rect x="16" y="166" width="72" height="18" rx="9" fill="var(--ochre)" />
        <text x="52" y="178" textAnchor="middle" fontSize="6.5" letterSpacing=".8" fill="#fff" style={{ fontFamily: "var(--font-mono)" }}>
          PAY NEXT
        </text>
      </g>
    </svg>
  );
}
