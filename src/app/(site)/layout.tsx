import type { ReactNode } from "react";
import { Analytics } from "@/components/analytics/Analytics";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { ConsentBanner, SiteFooter, SiteHeader } from "@/components/ui";
import { publicEnv } from "@/lib/env";
import { getGames, getSettings } from "@/lib/sanity/content";

/**
 * The public site shell. `SiteHeader` reads the pathname itself to mark the
 * current section (and switch to its game variant on /games/[slug]), so pages
 * don't pass it anything.
 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [games, settings] = await Promise.all([getGames(), getSettings()]);

  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter
        newsletter={<NewsletterForm tone="on-dark" source="footer" />}
        games={games.map((game) => ({ label: game.name, href: `/games/${game.slug}` }))}
        socialLinks={settings.socialLinks.map((link) => ({ label: link.label, href: link.url }))}
        supportEmail={settings.supportEmail ?? undefined}
      />
      <ConsentBanner />
      <Analytics gtmId={publicEnv.gtmId} />
    </>
  );
}
