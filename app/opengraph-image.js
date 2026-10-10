import { ImageResponse } from "next/og";

// Share preview (WhatsApp, Facebook, LinkedIn…), generated at build time.
export const alt = "TECHGABON — Trouvez un professionnel qualifié au Gabon";
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
          background: "linear-gradient(135deg, #0f1a2e 0%, #1a4d8f 55%, #0f1a2e 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 700, color: "#f2a93b", letterSpacing: 2 }}>TECHGABON</div>
        <div style={{ marginTop: 28, fontSize: 68, fontWeight: 700, lineHeight: 1.1, maxWidth: 1000 }}>
          Le bon professionnel, disponible maintenant
        </div>
        <div style={{ marginTop: 28, fontSize: 32, color: "rgba(255,255,255,0.8)", maxWidth: 950 }}>
          Techniciens et professionnels vérifiés, partout au Gabon.
        </div>
      </div>
    ),
    size
  );
}
