import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { Featured, GameSummary, PostSummary, SiteSettings } from "@/lib/sanity/types";

const content = vi.hoisted(() => ({
  getFeatured: vi.fn(),
  getGames: vi.fn(),
  getPosts: vi.fn(),
  getSettings: vi.fn(),
}));
vi.mock("@/lib/sanity/content", () => content);
vi.mock("@/app/actions/beta", () => ({ joinBeta: vi.fn() }));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import Home, { revalidate } from "./page";

const featured: Featured[] = [
  {
    slug: "terraforge",
    name: "TerraForge",
    status: "out-now",
    genre: "Sandbox",
    platformLabel: "Web",
    blurb: "Build planets.",
    art: null,
    cta: { label: "Play free in browser", href: "https://www.terraforgeworlds.com" },
    detailHref: "/games/terraforge",
  },
  {
    slug: "space-cowboy",
    name: "Space Cowboy",
    status: "coming-soon",
    genre: "Puzzle",
    platformLabel: "iOS · Android",
    blurb: "Slingshot.",
    art: null,
    cta: { label: "Join the beta", href: "#beta" },
    detailHref: "/games/space-cowboy",
  },
];
const games: GameSummary[] = [
  { slug: "terraforge", name: "TerraForge", status: "out-now", genre: "Sandbox", platformLabel: "Web", cover: null },
  { slug: "space-cowboy", name: "Space Cowboy", status: "coming-soon", genre: "Puzzle", platformLabel: "iOS · Android", cover: null },
];
const posts: PostSummary[] = [1, 2, 3].map((n) => ({
  slug: `post-${n}`,
  title: `Post ${n}`,
  date: "2026-11-05",
  kind: "update",
  excerpt: null,
  image: null,
  game: null,
}));
const emptySettings: SiteSettings = {
  supportEmail: null,
  socialLinks: [],
  betaCallout: null,
  newsletterBlurb: null,
  studioPhoto: null,
  foundedLine: null,
};
const fullSettings: SiteSettings = {
  ...emptySettings,
  betaCallout: {
    eyebrow: "NOW RECRUITING TESTERS",
    title: "Play Space Cowboy before anyone else.",
    body: "Join the iOS and Android beta.",
    game: { slug: "space-cowboy", name: "Space Cowboy" },
    platforms: ["ios", "android"],
  },
  foundedLine: "Founded in New York in 2020.",
};

function withContent(full: boolean) {
  content.getFeatured.mockResolvedValue(full ? featured : []);
  content.getGames.mockResolvedValue(full ? games : []);
  content.getPosts.mockResolvedValue(full ? posts : []);
  content.getSettings.mockResolvedValue(full ? fullSettings : emptySettings);
}

beforeEach(() => {
  for (const fn of Object.values(content)) fn.mockReset();
});

it("revalidates hourly", () => {
  expect(revalidate).toBe(3600);
});

it("renders the first featured game as the page h1, then the home sections in order", async () => {
  withContent(true);
  render(await Home());
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("TerraForge");
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByRole("region", { name: "Featured games" })).toBeInTheDocument();

  const h2s = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
  expect(h2s).toEqual([
    "An independent studio making games that make you think.",
    "All games",
    "Play Space Cowboy before anyone else.",
    "A small studio with a big backlog of ideas.",
    "News",
  ]);
  expect(screen.getByText("Sandboxes, puzzlers, simulations and whatever we dream up next — for web, iOS and Android.")).toBeInTheDocument();
  expect(content.getPosts).toHaveBeenCalledWith(3);
});

it("fills the grid, the beta callout, the studio teaser and three news cards", async () => {
  withContent(true);
  const { container } = render(await Home());

  expect(container.querySelector("#games")).toContainElement(screen.getByRole("link", { name: /OUT NOW\s*TerraForge/ }));
  expect(within(screen.getByRole("list", { name: "Games" })).getAllByRole("link")).toHaveLength(2);

  expect(screen.getByRole("button", { name: "Join the beta" })).toBeInTheDocument();
  expect(container.querySelector('input[name="game"]')).toHaveValue("space-cowboy");
  expect(screen.getByRole("combobox", { name: "Platform" })).toBeInTheDocument();

  const studio = container.querySelector("#studio")!;
  expect(studio).toHaveTextContent("The studio");
  expect(studio).toHaveTextContent("Founded in New York in 2020.");
  for (const value of ["Play first", "Smart, not stuffy", "Play anywhere"]) expect(studio).toHaveTextContent(value);
  expect(within(studio as HTMLElement).getByRole("link", { name: "About the studio" })).toHaveAttribute("href", "/about");

  const news = container.querySelector("#news")!;
  expect(within(news as HTMLElement).getByRole("link", { name: "All news →" })).toHaveAttribute("href", "/news");
  expect(within(screen.getByRole("list", { name: "Latest news" })).getAllByRole("link")).toHaveLength(3);
});

it("with no content renders the empty grid message and no hero, callout or news", async () => {
  withContent(false);
  const { container } = render(await Home());
  expect(screen.getByText("New games are on the way.")).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Featured games" })).toBeNull();
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("An independent studio making games that make you think.");
  expect(screen.queryByRole("button", { name: "Join the beta" })).toBeNull();
  expect(container.querySelector("#news")).toBeNull();
  // The studio teaser is static copy and still shows.
  expect(screen.getByRole("heading", { level: 2, name: "A small studio with a big backlog of ideas." })).toBeInTheDocument();
  expect(container.textContent).not.toMatch(/\[[A-Z ]+\]/);
});

it("hides the callout when the configured callout has no game to sign up for", async () => {
  withContent(true);
  content.getSettings.mockResolvedValue({ ...fullSettings, betaCallout: { ...fullSettings.betaCallout!, game: null } });
  render(await Home());
  expect(screen.queryByRole("button", { name: "Join the beta" })).toBeNull();
});

it("has its own title", async () => {
  const { metadata } = await import("./page");
  expect(metadata.title).toBe("inkOrange Studios — Games that make you think");
});
