import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { ViewportHealer } from "@/components/viewport-healer";
import "@/styles/globals.css";
import { type Metadata, type Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
});

const splashMedia = (w: number, h: number, ratio: number) =>
  `screen and (device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`;

export const viewport: Viewport = {
  viewportFit: "cover",
  // iOS auto-zooms (and pans the whole layout viewport) when focusing inputs
  // with font-size < 16px; maximumScale disables only that auto-zoom —
  // Safari still allows manual pinch zoom since iOS 10.
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#121317" },
    { media: "(prefers-color-scheme: light)", color: "#f6f6f8" },
  ],
};

export const metadata: Metadata = {
  title: "Fit Manager",
  description: "Your fitness tracking companion",
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    // "black-translucent" is deprecated and breaks the standalone layout
    // viewport (fixed bottom elements anchor ~a status bar height above the
    // physical screen bottom). "default" lets iOS manage the bar; its color
    // follows themeColor.
    statusBarStyle: "default",
    title: "Fit Manager",
    // iOS shows a black screen while a standalone PWA launches unless an
    // exact-resolution startup image matches the device.
    startupImage: [
      {
        url: "/splash/apple-splash-1320-2868.png",
        media: splashMedia(440, 956, 3),
      },
      {
        url: "/splash/apple-splash-1206-2622.png",
        media: splashMedia(402, 874, 3),
      },
      {
        url: "/splash/apple-splash-1290-2796.png",
        media: splashMedia(430, 932, 3),
      },
      {
        url: "/splash/apple-splash-1179-2556.png",
        media: splashMedia(393, 852, 3),
      },
      {
        url: "/splash/apple-splash-1284-2778.png",
        media: splashMedia(428, 926, 3),
      },
      {
        url: "/splash/apple-splash-1170-2532.png",
        media: splashMedia(390, 844, 3),
      },
      {
        url: "/splash/apple-splash-1125-2436.png",
        media: splashMedia(375, 812, 3),
      },
      {
        url: "/splash/apple-splash-1242-2688.png",
        media: splashMedia(414, 896, 3),
      },
      {
        url: "/splash/apple-splash-828-1792.png",
        media: splashMedia(414, 896, 2),
      },
      {
        url: "/splash/apple-splash-750-1334.png",
        media: splashMedia(375, 667, 2),
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <html
        lang="en"
        className={`${inter.variable} ${plexMono.variable}`}
        suppressHydrationWarning
      >
        <head />
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <LayoutWrapper>{children}</LayoutWrapper>
            <ViewportHealer />
            <Toaster richColors />
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
