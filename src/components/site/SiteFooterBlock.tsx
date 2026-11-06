import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { SiteFooter } from "@/components/ui";
import { getGames, getSettings } from "@/lib/sanity/content";

export type SiteFooterBlockProps = {
  variant: "full" | "compact";
  /** Reserve room below `lg` for a `StickyPlayBar` rendered after the footer. */
  stickyBarSpace?: boolean;
};

/**
 * `SiteFooter` wired to content: the newsletter form, game links (full variant
 * only, so the compact footer skips the fetch), social links and support email.
 * Shared by the leaf layouts so both footers stay identical apart from the variant.
 */
export async function SiteFooterBlock({ variant, stickyBarSpace = false }: SiteFooterBlockProps) {
  const [games, settings] = await Promise.all([variant === "full" ? getGames() : Promise.resolve([]), getSettings()]);

  return (
    <SiteFooter
      variant={variant}
      stickyBarSpace={stickyBarSpace}
      newsletter={<NewsletterForm tone="on-dark" source="footer" />}
      games={games.map((game) => ({ label: game.name, href: `/games/${game.slug}` }))}
      socialLinks={settings.socialLinks.map((link) => ({ label: link.label, href: link.url }))}
      supportEmail={settings.supportEmail ?? undefined}
    />
  );
}
