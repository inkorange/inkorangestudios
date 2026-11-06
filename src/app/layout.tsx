import type { Metadata, Viewport } from "next";
import { display, sans, mono } from "./fonts";
import { ConsentDefaults } from "@/components/analytics/ConsentDefaults";
import { publicEnv } from "@/lib/env";
import { SITE_DESCRIPTION, SITE_LOCALE, SITE_NAME } from "@/lib/seo";
import { tokenValue } from "@/lib/tokens";
import "@/styles/globals.scss";

// Defaults for routes that don't set their own; pages use pageMetadata() from @/lib/seo.
export const metadata: Metadata = {
  // Resolves relative canonical, OG and icon URLs against the real site.
  metadataBase: new URL(publicEnv.siteUrl),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { type: "website", siteName: SITE_NAME, locale: SITE_LOCALE, title: SITE_NAME, description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESCRIPTION },
};

export const viewport: Viewport = { themeColor: tokenValue("--color-paper") };

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
