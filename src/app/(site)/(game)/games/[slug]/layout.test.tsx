import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { Game } from "@/lib/sanity/types";

const content = vi.hoisted(() => ({ getGame: vi.fn() }));
vi.mock("@/lib/sanity/content", () => content);
// SiteFooterBlock is an async server component (tested on its own); stub it to see what the layout asks for.
const footer = vi.hoisted(() =>
  vi.fn((props: { variant: string; stickyBarSpace?: boolean }) => (
    <footer data-variant={props.variant} data-sticky-bar={String(Boolean(props.stickyBarSpace))} />
  )),
);
vi.mock("@/components/site/SiteFooterBlock", () => ({ SiteFooterBlock: footer }));

import GameRouteLayout from "./layout";

const game: Game = {
  slug: "terraforge",
  name: "TerraForge",
  status: "out-now",
  genres: ["Sandbox"],
  platforms: ["Web"],
  stores: [],
  blurb: "Build planets.",
  description: [],
  keyArt: null,
  coverArt: null,
  media: [],
  features: [],
  facts: [],
  priceLabel: "Free",
  primaryCta: { label: "Play in browser", href: "https://www.terraforgeworlds.com" },
  notify: null,
  beta: null,
  pressKitUrl: null,
  featured: false,
};

const props = (slug: string) => ({ children: <p>Game body</p>, params: Promise.resolve({ slug }) });

beforeEach(() => {
  vi.clearAllMocks();
});

it("puts the page in <main>, then the compact footer with room for the play bar, then the bar", async () => {
  content.getGame.mockResolvedValue(game);
  render(await GameRouteLayout(props("terraforge")));
  expect(content.getGame).toHaveBeenCalledWith("terraforge");
  const main = screen.getByRole("main");
  expect(within(main).getByText("Game body")).toBeInTheDocument();
  const contentinfo = screen.getByRole("contentinfo");
  expect(footer.mock.calls[0][0]).toEqual({ variant: "compact", stickyBarSpace: true });

  const bar = screen.getByRole("complementary", { name: "TerraForge quick play" });
  expect(within(bar).getByText("Free · Web")).toBeInTheDocument();
  expect(within(bar).getByRole("link", { name: "Play now" })).toHaveAttribute("href", "https://www.terraforgeworlds.com");
  // After the footer, so it can float over it to the end of the page.
  expect(main.compareDocumentPosition(contentinfo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(contentinfo.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it("uses the CTA's own label when the game isn't out yet, and skips an empty price", async () => {
  content.getGame.mockResolvedValue({ ...game, status: "coming-soon", priceLabel: null, primaryCta: { label: "Wishlist on Steam", href: "https://store.steampowered.com/app/1" } });
  render(await GameRouteLayout(props("terraforge")));
  const bar = screen.getByRole("complementary", { name: "TerraForge quick play" });
  expect(within(bar).getByRole("link", { name: "Wishlist on Steam" })).toBeInTheDocument();
  expect(within(bar).getByText("Web")).toBeInTheDocument();
});

it("falls back to the first store link without a primary CTA", async () => {
  content.getGame.mockResolvedValue({
    ...game,
    status: "coming-soon",
    platforms: ["Android", "iOS"],
    primaryCta: null,
    stores: [{ platform: "Android", href: "https://play.google.com/store/apps/details?id=x" }, { platform: "iOS", href: "https://apps.apple.com/app/id1" }],
  });
  render(await GameRouteLayout(props("terraforge")));
  const bar = screen.getByRole("complementary", { name: "TerraForge quick play" });
  expect(within(bar).getByRole("link", { name: "Google Play" })).toHaveAttribute("href", "https://play.google.com/store/apps/details?id=x");
});

it("has no play bar and no extra footer room without a primary CTA or a game", async () => {
  content.getGame.mockResolvedValue({ ...game, primaryCta: null });
  const { unmount } = render(await GameRouteLayout(props("terraforge")));
  expect(screen.queryByRole("complementary", { name: /quick play/ })).toBeNull();
  expect(footer.mock.calls[0][0]).toEqual({ variant: "compact", stickyBarSpace: false });
  unmount();

  content.getGame.mockResolvedValue(null);
  render(await GameRouteLayout(props("nope")));
  expect(screen.queryByRole("complementary", { name: /quick play/ })).toBeNull();
  expect(screen.getByRole("contentinfo")).toHaveAttribute("data-sticky-bar", "false");
});
