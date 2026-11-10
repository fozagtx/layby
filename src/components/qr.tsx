"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** Black on bone, maximum contrast, no logo in the middle. DESIGN.md §5.3. */
export function Qr({ value, size = 280, label }: { value: string; size?: number; label: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { margin: 3, width: size * 2, errorCorrectionLevel: "M", color: { dark: "#141413", light: "#fffdf8" } })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [value, size]);

  if (!src) return <div style={{ width: size, height: size }} className="skeleton" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} width={size} height={size} alt={label} className="rounded-tile" />;
}
