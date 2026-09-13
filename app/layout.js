import "./globals.css";

export const metadata = {
  title: "TECHGABON — Trouvez un professionnel qualifié au Gabon",
  description: "La plateforme qui connecte entreprises et particuliers avec des techniciens et professionnels vérifiés, disponibles immédiatement au Gabon.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
