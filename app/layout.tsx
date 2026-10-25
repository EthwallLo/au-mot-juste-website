import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Header from "./components/header";
import Footer from "./components/footer";
import BackToTopButton from "./components/backToTopButton";
import TextSizeControls from "./components/textSizeControls";
import { montserrat } from "./fonts";
import { SITE_NAME, SITE_URL } from "./lib/seo";

const siteTitle =
  "Au mot juste | Correction, relecture et réécriture professionnelle";

const siteDescription =
  "Correction, relecture, réécriture et traduction anglais-français pour des textes clairs, fluides et professionnels : manuscrits, CV, contenus web et documents.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: siteTitle,
  description: siteDescription,
  icons: { icon: "/icon.png" },
  verification: {
    google: "MSUVmcbKfJXbo9LdJIxFVAE9yCsROgxazl10DETeE-w",
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    siteName: SITE_NAME,
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${montserrat.className} bg-white text-gray-900`}>
        <a href="#contenu-principal" className="skip-link">
          Aller au contenu principal
        </a>
        <Header />

        <main id="contenu-principal">{children}</main>

        <Footer />
        <TextSizeControls />
        <BackToTopButton />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
