import type { Metadata, Viewport } from "next";
import { Exo_2, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/layout/Providers";
import "./globals.css";

/* ─── Fonts ──────────────────────────────────────────────────────── */
const exo2 = Exo_2({
  subsets:  ["latin"],
  variable: "--font-sans",
  weight:   ["300", "400", "600", "700", "800", "900"],
  display:  "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets:  ["latin"],
  variable: "--font-mono",
  weight:   ["400", "600"],
  display:  "swap",
});

/* ─── Metadata SEO ───────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: {
    default:  "World Connect",
    template: "%s | World Connect",
  },
  description:
    "Construisez votre empire numérique avec World Connect. Partagez, connectez et développez votre réseau.",
  keywords:  ["réseau social", "professionnel", "networking", "connexion", "world connect"],
  authors:   [{ name: "World Connect" }],
  creator:   "World Connect",
  publisher: "World Connect",

  // PWA / App
  manifest: "/manifest.json",
  appleWebApp: {
    capable:    true,
    statusBarStyle: "black-translucent",
    title:      "World Connect",
  },

  // Open Graph
  openGraph: {
    type:        "website",
    locale:      "fr_FR",
    siteName:    "World Connect",
    title:       "World Connect — Votre empire numérique",
    description: "Créez votre présence digitale professionnelle. Partagez, connectez et développez votre réseau.",
    images: [
      {
        url:    "/og-image.png",
        width:  1200,
        height: 630,
        alt:    "World Connect",
      },
    ],
  },

  // Twitter/X
  twitter: {
    card:    "summary_large_image",
    title:   "World Connect",
    description: "Votre empire numérique",
    images:  ["/og-image.png"],
  },

  // Icons
  icons: {
    icon:        "/favicon.ico",
    shortcut:    "/favicon-16x16.png",
    apple:       "/apple-touch-icon.png",
  },

  robots: {
    index:  true,
    follow: true,
  },
};

/* ─── Viewport ───────────────────────────────────────────────────── */
export const viewport: Viewport = {
  width:               "device-width",
  initialScale:        1,
  maximumScale:        1,         // bloque le zoom natif → UX app mobile
  userScalable:        false,
  viewportFit:         "cover",   // plein écran sous le notch
  themeColor:          "#0d1f4e", // navy-900 (barre status mobile)
};

/* ─── Root Layout ────────────────────────────────────────────────── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${exo2.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers>
          {/* 
            Plein écran total : min-h-[100dvh] couvre le viewport
            y compris les barres safari/chrome mobiles
          */}
          <div className="flex min-h-[100dvh] flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
