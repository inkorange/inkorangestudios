import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { SiteSettings } from "@/lib/sanity/types";

const content = vi.hoisted(() => ({ getGames: vi.fn(), getSettings: vi.fn() }));
vi.mock("@/lib/sanity/content", () => content);
vi.mock("@/app/actions/newsletter", () => ({ subscribeNewsletter: vi.fn() }));

import { SiteFooterBlock } from "./SiteFooterBlock";

const settings: SiteSettings = {
  supportEmail: "help@inkorangestudios.com",
  socialLinks: [{ label: "Bluesky", url: "https://bsky.app/profile/inkorange" }],
  betaCallout: null,
  newsletterBlurb: null,
  studioPhoto: null,
  foundedLine: null,
};

beforeEach(() => {
  content.getGames.mockReset().mockResolvedValue([
    { slug: "strata", name: "Strata", status: "in-development", genre: "Educational", platformLabel: "Web", cover: null },
  ]);
  content.getSettings.mockReset().mockResolvedValue(settings);
});

it("full: newsletter form, game links, socials and support email from content", async () => {
  const { container } = render(await SiteFooterBlock({ variant: "full" }));
  const footer = screen.getByRole("contentinfo");
  expect(footer).toHaveAttribute("id", "newsletter");
  expect(footer).toHaveAttribute("data-variant", "full");
  expect(footer).toHaveAttribute("data-sticky-bar", "false");
  expect(within(footer).getByRole("button", { name: "Subscribe" })).toBeInTheDocument();
  expect(footer.querySelector('input[name="source"]')).toHaveValue("footer");
  expect(within(footer).getByRole("link", { name: "Strata" })).toHaveAttribute("href", "/games/strata");
  expect(within(footer).getByRole("link", { name: "Bluesky" })).toHaveAttribute("href", "https://bsky.app/profile/inkorange");
  expect(within(footer).getByRole("link", { name: "Player support" })).toHaveAttribute("href", "mailto:help@inkorangestudios.com");
  expect(container.querySelector("#press")).toBeNull();
  expect(within(footer).queryByRole("link", { name: "Press kit" })).toBeNull();
});

it("hides Player support when settings have no support email", async () => {
  content.getSettings.mockResolvedValue({ ...settings, supportEmail: null });
  render(await SiteFooterBlock({ variant: "full" }));
  expect(screen.queryByRole("link", { name: "Player support" })).toBeNull();
});

it("compact: one link row, no game list fetch, and room for the sticky play bar when asked", async () => {
  render(await SiteFooterBlock({ variant: "compact", stickyBarSpace: true }));
  const footer = screen.getByRole("contentinfo");
  expect(footer).toHaveAttribute("data-variant", "compact");
  expect(footer).toHaveAttribute("data-sticky-bar", "true");
  expect(within(footer).getByRole("button", { name: "Subscribe" })).toBeInTheDocument();
  expect(within(footer).getByRole("link", { name: "Bluesky" })).toBeInTheDocument();
  expect(content.getGames).not.toHaveBeenCalled();
});
