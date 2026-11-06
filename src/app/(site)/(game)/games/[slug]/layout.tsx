import type { ReactNode } from "react";
import { SiteFooterBlock } from "@/components/site/SiteFooterBlock";
import { StickyPlayBar } from "@/components/ui";
import { STORE_LINK_LABELS } from "@/lib/games";
import { getGame } from "@/lib/sanity/content";
import type { Game } from "@/lib/sanity/types";

function playBar(game: Game | null) {
  // Without a main call to action, the first store link stands in.
  const store = game?.stores[0];
  const cta = game?.primaryCta ?? (store ? { label: STORE_LINK_LABELS[store.platform].short, href: store.href } : null);
  if (!game || !cta) return null;
  return {
    title: game.name,
    meta: [game.priceLabel, game.platforms.join(" · ")].filter(Boolean).join(" · ") || undefined,
    // "Play now" only makes sense once the game is out; otherwise keep the CTA's own words ("Wishlist", "Join the beta").
    action: { label: game.status === "out-now" ? "Play now" : cta.label, href: cta.href },
  };
}

/**
 * Game pages: the page in `<main>`, the compact footer, then the phone
 * `StickyPlayBar`. The bar comes after the footer so it stays stuck to the
 * viewport through the footer and parks over the footer's reserved bottom room.
 * `getGame` is the same fetch the page makes, so it is deduplicated per request.
 */
export default async function GameRouteLayout({ children, params }: { children: ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bar = playBar(await getGame(slug));

  return (
    <>
      <main>{children}</main>
      <SiteFooterBlock variant="compact" stickyBarSpace={bar !== null} />
      {bar ? <StickyPlayBar title={bar.title} meta={bar.meta} action={bar.action} /> : null}
    </>
  );
}
