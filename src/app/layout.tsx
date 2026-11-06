import type { Metadata } from "next";
import { display, sans, mono } from "./fonts";
import { ConsentDefaults } from "@/components/analytics/ConsentDefaults";
import { publicEnv } from "@/lib/env";
import "@/styles/globals.scss";

export const metadata: Metadata = {
  // Resolves relative OG image URLs (the generated /opengraph-image) to the real site.
  metadataBase: new URL(publicEnv.siteUrl),
  title: "inkOrange Studios",
  description: "inkOrange Studios",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <ConsentDefaults />
        {children}
      </body>
    </html>
  );
}
