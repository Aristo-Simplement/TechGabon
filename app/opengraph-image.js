import { ImageResponse } from "next/og";

// Share preview (WhatsApp, Facebook, LinkedIn…), generated at build time.
export const alt = "ONASKILL — Chaque savoir-faire mérite une opportunité";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #071226 0%, #12294d 60%, #071226 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 330 }}>
          <div style={{ marginLeft: 12, width: 318, height: 6, borderRadius: 3, background: "#e5b85a" }} />
          <div style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
            <div style={{ width: 52, height: 52, borderRadius: 26, border: "11px solid #e5b85a" }} />
            <div style={{ marginLeft: 10, fontSize: 52, fontWeight: 800, color: "#ffffff", letterSpacing: 1 }}>NASKILL</div>
          </div>
        </div>
        <div style={{ marginTop: 28, fontSize: 60, fontWeight: 700, lineHeight: 1.12, maxWidth: 1040 }}>
          Diplômé, formé ou autodidacte, chaque savoir-faire mérite une opportunité.
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: "rgba(255,255,255,0.8)", maxWidth: 1000 }}>
          Faites connaître votre savoir-faire et recevez des missions partout au Gabon.
        </div>
      </div>
    ),
    size
  );
}
