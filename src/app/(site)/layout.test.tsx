import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { SiteSettings } from "@/lib/sanity/types";

const content = vi.hoisted(() => ({ getGames: vi.fn(), getSettings: vi.fn() }));
vi.mock("@/lib/sanity/content", () => content);
vi.mock("@/app/actions/newsletter", () => ({ subscribeNewsletter: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));
const analytics = vi.hoisted(() => vi.fn((props: { gtmId?: string }) => <span data-testid="analytics" data-gtm={props.gtmId ?? ""} />));
vi.mock("@/components/analytics/Analytics", () => ({ Analytics: analytics }));
vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>();
  return { ...actual, publicEnv: { ...actual.publicEnv, gtmId: "GTM-TEST123" } };
});

import SiteLayout from "./layout";

const settings: SiteSettings = {
  supportEmail: "help@inkorangestudios.com",
  socialLinks: [{ label: "YouTube", url: "https://youtube.com/@inkorange" }],
  betaCallout: null,
  newsletterBlurb: null,
  studioPhoto: null,
  foundedLine: null,
};

beforeEach(() => {
  localStorage.clear();
  content.getGames.mockResolvedValue([
    { slug: "terraforge", name: "TerraForge", status: "out-now", genre: "Sandbox", platformLabel: "Web", cover: null },
  ]);
  content.getSettings.mockResolvedValue(settings);
});

it("wraps the page in the header, main, footer, consent banner and analytics", async () => {
  render(await SiteLayout({ children: <p>Page body</p> }));
  expect(screen.getByRole("banner")).toBeInTheDocument();
  expect(within(screen.getByRole("navigation", { name: "Primary" })).getByRole("link", { name: "Games" })).toHaveAttribute("aria-current", "true");
  expect(within(screen.getByRole("main")).getByText("Page body")).toBeInTheDocument();
  expect(screen.getByRole("contentinfo")).toHaveAttribute("id", "newsletter");
  expect(screen.getByRole("region", { name: "Cookie consent" })).toBeInTheDocument();
  expect(screen.getByTestId("analytics")).toHaveAttribute("data-gtm", "GTM-TEST123");
  expect(analytics.mock.calls[0][0]).toEqual({ gtmId: "GTM-TEST123" });
});

it("fills the footer from content: newsletter form, game links, socials, support email, press anchor", async () => {
  const { container } = render(await SiteLayout({ children: null }));
  const footer = screen.getByRole("contentinfo");
  expect(within(footer).getByRole("button", { name: "Subscribe" })).toBeInTheDocument();
  expect(footer.querySelector('input[name="source"]')).toHaveValue("footer");
  expect(within(footer).getByRole("link", { name: "TerraForge" })).toHaveAttribute("href", "/games/terraforge");
  expect(within(footer).getByRole("link", { name: "YouTube" })).toHaveAttribute("href", "https://youtube.com/@inkorange");
  expect(within(footer).getByRole("link", { name: "Player support" })).toHaveAttribute("href", "mailto:help@inkorangestudios.com");
  expect(container.querySelector("#press")).toContainElement(within(footer).getByRole("link", { name: "Press kit" }));
});
