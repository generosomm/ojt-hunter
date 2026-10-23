import { ImageResponse } from "next/og";

// The preview Messenger and Facebook show when someone shares a link.
export const alt = "OJT Hunter: find your OJT with real pay, HTE status and where to apply";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "72px 84px",
          color: "#eef0ff",
          background: "radial-gradient(900px 600px at 100% 0%, rgba(242,194,48,0.28), transparent 60%), radial-gradient(900px 700px at 0% 40%, rgba(53,64,142,0.9), transparent 65%), #0c1030",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: 16, background: "#35408e", color: "#f2c230", fontSize: 26, fontWeight: 800 }}>
              OJT
            </div>
            <div style={{ fontSize: 40, fontWeight: 700 }}>Hunter</div>
          </div>
          <div style={{ fontSize: 104, fontWeight: 700, lineHeight: 1, letterSpacing: -3, display: "flex", flexDirection: "column" }}>
            <span>Find your</span>
            <span>OJT.</span>
          </div>
          <div style={{ fontSize: 34, color: "#aab0d8" }}>Real pay, HTE status and where to apply.</div>
        </div>
        {/* the glass intern ID from the home page */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 380,
            height: 240,
            padding: 28,
            borderRadius: 30,
            background: "rgba(255,255,255,0.12)",
            border: "2px solid rgba(255,255,255,0.22)",
            transform: "rotate(-5deg)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 24, color: "#aab0d8" }}>NU Laguna intern</span>
            <span style={{ width: 54, height: 38, borderRadius: 8, background: "#f2c230" }} />
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <span style={{ width: 120, height: 14, borderRadius: 7, background: "rgba(255,255,255,0.35)" }} />
            <span style={{ width: 70, height: 14, borderRadius: 7, background: "rgba(242,194,48,0.7)" }} />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
