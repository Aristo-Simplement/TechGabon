import "./globals.css";

const SITE_URL = "https://tech-gabon.vercel.app";
const TITLE = "TECHGABON — Trouvez un professionnel qualifié au Gabon";
const DESCRIPTION = "La plateforme qui connecte entreprises et particuliers avec des techniciens et professionnels vérifiés, disponibles immédiatement au Gabon.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["Gabon", "technicien", "artisan", "professionnel", "Libreville", "Port-Gentil", "Owendo", "plombier", "électricien", "soudeur", "maintenance", "BTP"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: "TECHGABON",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: "#1a4d8f",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
