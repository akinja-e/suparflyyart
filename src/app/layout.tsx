import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
// Display face: Chakra Petch — monoline with 45° chamfered corners, the same
// geometry as the S mark. Self-hosted, so no font CDN at build or runtime.
import "@fontsource/chakra-petch/300.css";
import "@fontsource/chakra-petch/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "SUPARFLYYART",
  description: "Art pieces and collectible objects.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body className="min-h-dvh bg-paper text-ink">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
