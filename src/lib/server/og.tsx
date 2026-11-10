import "server-only";
import type { ReactNode } from "react";

/** Loads a Google font as TrueType (Satori can't read woff2), subset to the text drawn. */
async function googleFont(family: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`,
      { signal: AbortSignal.timeout(5000) },
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await fetch(url, { signal: AbortSignal.timeout(5000) }).then((r) => r.arrayBuffer());
  } catch {
    return null; // fall back to the default font rather than failing the preview
  }
}

export async function ogFonts(serifText: string, monoText: string) {
  const [serif, mono] = await Promise.all([
    googleFont("Instrument+Serif", serifText),
    googleFont("Geist+Mono:wght@500", monoText),
  ]);
  const fonts: { name: string; data: ArrayBuffer; weight: 400 | 500; style: "normal" }[] = [];
  if (serif) fonts.push({ name: "Serif", data: serif, weight: 400, style: "normal" });
  if (mono) fonts.push({ name: "Mono", data: mono, weight: 500, style: "normal" });
  return fonts;
}

export const OG = {
  canvas: "#F4F1EA",
  surface: "#FFFDF8",
  ink: "#141413",
  muted: "#6B6760",
  hairline: "#CFC7B8",
  green: "#0E3B32",
  ochre: "#B4802C",
};

export function OgMark({ size = 56 }: { size?: number }) {
  const u = size / 22;
  return (
    <div style={{ display: "flex", position: "relative", width: size, height: size }}>
      <div style={{ position: "absolute", left: 7 * u, top: 1.5 * u, width: 8 * u, height: 4.5 * u, borderRadius: 1.5 * u, border: `${1.5 * u}px dashed ${OG.ochre}` }} />
      <div style={{ position: "absolute", left: 4 * u, top: 7.5 * u, width: 14 * u, height: 5 * u, borderRadius: 1.5 * u, background: OG.green }} />
      <div style={{ position: "absolute", left: 1 * u, top: 14 * u, width: 20 * u, height: 6 * u, borderRadius: 1.5 * u, background: OG.green }} />
    </div>
  );
}

/** One brick per payment, as on the plan page. */
export function OgBricks({ total, paid, width }: { total: number; paid: number; width: number }) {
  const n = Math.min(total, 24);
  const gap = n > 12 ? 6 : 10;
  const w = (width - gap * (n - 1)) / n;
  return (
    <div style={{ display: "flex", gap }}>
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          style={{
            width: w,
            height: n > 12 ? 44 : 64,
            borderRadius: 8,
            background: i < paid ? OG.green : "transparent",
            border: i < paid ? `2px solid ${OG.green}` : i === paid ? `3px dashed ${OG.ochre}` : `2px solid ${OG.hairline}`,
          }}
        />
      ))}
    </div>
  );
}

export function OgFrame({ children }: { children: ReactNode }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: OG.canvas, padding: 64, fontFamily: "Mono" }}>
      {children}
    </div>
  );
}
