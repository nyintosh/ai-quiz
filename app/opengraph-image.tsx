import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        background: "#07080b",
        padding: "80px 100px",
        gap: "80px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 160,
          height: 160,
          background: "#0f172a",
          borderRadius: 20,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "#3b82f6",
          }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            color: "#f8fafc",
            lineHeight: 1,
          }}
        >
          Quiz AI
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#94a3b8",
            lineHeight: 1.4,
            maxWidth: 640,
          }}
        >
          Check multiple-choice answers with your camera and AI
        </div>
      </div>
    </div>,
    { ...size },
  );
}
