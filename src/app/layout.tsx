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
    statusBarStyle: "black-translucent",
    title: "Fit Manager",
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
