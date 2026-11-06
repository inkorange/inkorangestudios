import type { ReactNode } from "react";
import { Analytics } from "@/components/analytics/Analytics";
import { ConsentBanner, SiteHeader } from "@/components/ui";
import { publicEnv } from "@/lib/env";

/**
 * The public site shell. `SiteHeader` reads the pathname itself to mark the
 * current section (and switch to its game variant on /games/[slug]), so pages
 * don't pass it anything. `<main>` and the footer belong to the leaf layouts,
 * which pick the footer variant: `(pages)/layout.tsx` (full) and
 * `(game)/games/[slug]/layout.tsx` (compact, with room for the sticky play bar).
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <ConsentBanner />
      <Analytics gtmId={publicEnv.gtmId} />
    </>
  );
}
