import { ImageResponse } from "next/og";
import { OG, OgBricks, OgFrame, OgMark, ogFonts } from "@/lib/server/og";

export const alt = "Layby: reserve it today, pay it off in NIM, take it home when it's paid";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const fonts = await ogFonts("LaybyReserve it today.", "PAY IT OFF IN NIM · TAKE IT HOME WHEN IT'S PAID3OF8");
  return new ImageResponse(
    (
      <OgFrame>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <OgMark size={52} />
          <div style={{ display: "flex", fontFamily: "Serif", fontSize: 48, color: OG.ink }}>Layby</div>
        </div>
        <div style={{ display: "flex", marginTop: 72, fontFamily: "Serif", fontSize: 120, lineHeight: 1, color: OG.ink }}>
          Reserve it today.
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 30, letterSpacing: 3, color: OG.muted }}>
          PAY IT OFF IN NIM · TAKE IT HOME WHEN IT&apos;S PAID
        </div>
        <div style={{ display: "flex", flex: 1 }} />
        <OgBricks total={8} paid={3} width={1072} />
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
