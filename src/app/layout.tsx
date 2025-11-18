import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { LayoutWrapper } from "@/components/layout-wrapper";
import "@/styles/globals.css";

import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Fit Manager",
  // Use absolute URLs so these assets are requested from the app root,
  // not relative to nested routes like /training/session/[id].
  icons: [{ rel: "icon", url: "/apple-touch-icon.png" }],
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <LayoutWrapper>{children}</LayoutWrapper>
            <Toaster richColors />
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
