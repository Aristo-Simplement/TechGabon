import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

const TITLE = "ONASKILL — Chaque savoir-faire mérite une opportunité";
const DESCRIPTION = "Diplômé, formé ou autodidacte : faites connaître votre savoir-faire sur ONASKILL. Créez votre profil et recevez des missions d’entreprises et de particuliers partout au Gabon.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["Gabon", "technicien", "artisan", "professionnel", "Libreville", "Port-Gentil", "Owendo", "plombier", "électricien", "soudeur", "maintenance", "BTP"],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: "ONASKILL",
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
  themeColor: "#0b1b36",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        {/* Mount point for the Google Translate widget (see components/LanguageSwitcher.jsx) */}
        <div id="google_translate_element" hidden />
        {/* Anonymous, cookie-free visit statistics (enable "Analytics" in the Vercel project) */}
        <Analytics />
      </body>
    </html>
  );
}
