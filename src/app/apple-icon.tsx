import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the three-brick mark on bone. DESIGN.md §3. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#F4F1EA", position: "relative" }}>
        <div style={{ position: "absolute", left: 32, top: 116, width: 116, height: 36, borderRadius: 9, background: "#0E3B32" }} />
        <div style={{ position: "absolute", left: 50, top: 72, width: 80, height: 32, borderRadius: 9, background: "#0E3B32" }} />
        <div
          style={{
            position: "absolute",
            left: 68,
            top: 32,
            width: 44,
            height: 28,
            borderRadius: 8,
            border: "5px dashed #B4802C",
          }}
        />
      </div>
    ),
    size,
  );
}
