import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mapGame } from "@/lib/sanity/mappers";
import type { Game, GameSummary, PostSummary } from "@/lib/sanity/types";

const content = vi.hoisted(() => ({
  getGame: vi.fn(),
  getGameSlugs: vi.fn(),
  getGames: vi.fn(),
  getPosts: vi.fn(),
}));
vi.mock("@/lib/sanity/content", () => content);
vi.mock("@/app/actions/launchAlert", () => ({ requestLaunchAlert: vi.fn() }));
vi.mock("@/app/actions/beta", () => ({ joinBeta: vi.fn() }));
const navigation = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("next/navigation", () => navigation);
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import GamePage, { dynamicParams, generateMetadata, generateStaticParams, revalidate } from "./page";

// Review Focus 3: the Task 13 sparse fixture, run through the real mapper so every
// bracket placeholder is stripped exactly as it would be from Sanity.
const sparse = mapGame({
  slug: "terraforge",
  name: "TerraForge",
  status: "coming-soon",
  blurb: "Build worlds.",
  priceLabel: "[PRICE]",
  facts: [{ label: "Release", value: "[RELEASE DATE]" }],
  features: [{ title: "[FEATURE]", body: "x" }],
  primaryCta: { label: "[CTA]", url: "https://x.test" },
  pressKitUrl: " ",
  notifyPlatform: { enabled: true, platform: "[PLATFORM]" },
})!;

const block = (key: string, text: string) => ({
  _type: "block",
  _key: key,
  style: "normal",
  markDefs: [],
  children: [{ _type: "span", _key: `${key}s`, text, marks: [] }],
});

const full: Game = {
  slug: "terraforge",
  name: "TerraForge",
  status: "out-now",
  genres: ["Sandbox", "Creative"],
  platforms: ["Web"],
  stores: [],
  blurb: "Build planets and entire star systems.",
  description: [block("a", "TerraForge is a sandbox for making worlds."), block("b", "Visit real exoplanets.")],
  appIcon: null,
  keyArt: { src: "https://cdn.sanity.io/images/p/d/key-2000x1000.jpg", alt: "TerraForge key art", width: 2000, height: 1000 },
  coverArt: null,
  media: [
    { kind: "trailer", label: "Trailer", poster: null, url: "https://youtu.be/dQw4w9WgXcQ", duration: "1:30" },
    { kind: "image", label: "Planet editor", image: null },
  ],
  features: [{ title: "Procedural planets", body: "Generate a new world in seconds." }],
  facts: [
    { label: "Developer", value: "inkOrange Studios" },
    { label: "Genre", value: "Sandbox, Creative" },
  ],
  priceLabel: "Free",
  primaryCta: { label: "Play in browser", href: "https://www.terraforgeworlds.com" },
  notify: { platform: "Android" },
  beta: null,
  pressKitUrl: "https://inkorangestudios.com/press/terraforge.zip",
  featured: true,
};

const games: GameSummary[] = [
  { slug: "terraforge", name: "TerraForge", status: "out-now", genre: "Sandbox", platformLabel: "Web", cover: null, stores: [] },
  { slug: "mission-control", name: "Mission Control", status: "out-now", genre: "Simulation", platformLabel: "Web", cover: null, stores: [] },
];
const posts: PostSummary[] = [
  { slug: "exoplanets-update", title: "New exoplanet data", date: "2026-10-01", kind: "update", excerpt: null, image: null, game: { slug: "terraforge", name: "TerraForge" } },
  { slug: "patch-1-2", title: "Patch 1.2", date: "2026-09-12", kind: "patch-notes", excerpt: null, image: null, game: { slug: "terraforge", name: "TerraForge" } },
];

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

/** Rendered text, without the JSON-LD script (its arrays are JSON, not page copy). */
function visibleText(container: HTMLElement): string {
  const clone = container.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("script").forEach((script) => script.remove());
  return clone.textContent ?? "";
}

beforeEach(() => {
  vi.clearAllMocks();
  content.getGameSlugs.mockResolvedValue(["terraforge", "mission-control"]);
});

describe("route config", () => {
  it("prerenders every slug, renders new ones on demand and revalidates hourly", async () => {
    expect(await generateStaticParams()).toEqual([{ slug: "terraforge" }, { slug: "mission-control" }]);
    expect(dynamicParams).toBe(true);
    expect(revalidate).toBe(3600);
  });

  it("builds metadata from the game: title, blurb, key art, canonical", async () => {
    content.getGame.mockResolvedValue(full);
    const meta = await generateMetadata(params("terraforge"));
    expect(content.getGame).toHaveBeenCalledWith("terraforge");
    expect(meta.title).toBe("TerraForge — inkOrange Studios");
    expect(meta.description).toBe("Build planets and entire star systems.");
    expect(meta.alternates).toEqual({ canonical: "/games/terraforge" });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", images: [full.keyArt!.src] });
    expect(meta.openGraph).toMatchObject({
      type: "website",
      siteName: "inkOrange Studios",
      url: "/games/terraforge",
      title: "TerraForge — inkOrange Studios",
      description: "Build planets and entire star systems.",
      images: [{ url: full.keyArt!.src, width: 2000, height: 1000, alt: "TerraForge key art" }],
    });
  });

  it("returns not-found metadata for an unknown slug and the site share image without key art", async () => {
    content.getGame.mockResolvedValue(null);
    expect(await generateMetadata(params("nope"))).toEqual({
      title: "Page not found — inkOrange Studios",
      robots: { index: false, follow: true },
    });
    content.getGame.mockResolvedValue(sparse);
    const meta = await generateMetadata(params("terraforge"));
    expect(meta.openGraph).toMatchObject({ images: [{ url: "/opengraph-image" }] });
  });
});

it("calls notFound for an unknown slug", async () => {
  content.getGame.mockResolvedValue(null);
  content.getPosts.mockResolvedValue([]);
  content.getGames.mockResolvedValue([]);
  await expect(GamePage(params("nope"))).rejects.toThrow("NEXT_NOT_FOUND");
  expect(navigation.notFound).toHaveBeenCalledOnce();
});

it("a sparse game renders its h1 with no empty headings, store card or bracket text", async () => {
  content.getGame.mockResolvedValue(sparse);
  content.getPosts.mockResolvedValue([]);
  content.getGames.mockResolvedValue([]);
  const { container } = render(await GamePage(params("terraforge")));

  expect(screen.getByRole("heading", { level: 1, name: "TerraForge" })).toBeInTheDocument();
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  for (const name of ["About the game", "Features", "Latest updates", "More from inkOrange"]) {
    expect(screen.queryByRole("heading", { name })).toBeNull();
  }
  expect(screen.queryByText("Press kit")).toBeNull();
  expect(screen.queryByRole("region", { name: "Trailer and screenshots" })).toBeNull();
  expect(container.querySelector('[data-slot="art"]')).toBeNull();
  expect(screen.queryByRole("complementary", { name: "Get the game" })).toBeNull();
  expect(screen.queryByText("Game details")).toBeNull();
  // Help is always there.
  expect(screen.getByRole("link", { name: "Get support →" })).toHaveAttribute("href", "/support");
  expect(visibleText(container)).not.toContain("[");
});

it("the full TerraForge game renders every block in place", async () => {
  content.getGame.mockResolvedValue(full);
  content.getPosts.mockResolvedValue(posts);
  content.getGames.mockResolvedValue(games);
  const { container } = render(await GamePage(params("terraforge")));

  expect(content.getPosts).toHaveBeenCalledWith(2, "terraforge");

  // Title row
  expect(within(screen.getByRole("navigation", { name: "Breadcrumb" })).getByRole("link", { name: "Games" })).toHaveAttribute("href", "/#games");
  const titleRow = screen.getByRole("heading", { level: 1, name: "TerraForge" }).closest("div")!.parentElement!;
  for (const chip of ["OUT NOW", "Sandbox", "Creative", "Web"]) expect(within(titleRow).getByText(chip)).toBeInTheDocument();

  // The trailer takes the key art's place under the title
  expect(container.querySelector('[data-slot="art"]')).toBeNull();
  expect(container.querySelector('[data-slot="media"]')!.previousElementSibling).toHaveAttribute("data-slot", "title");

  // Media
  expect(screen.getByRole("button", { name: "Play the TerraForge trailer" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Show Planet editor" })).toBeInTheDocument();

  // About: lead + rich text rest
  expect(screen.getByRole("heading", { level: 2, name: "About the game" })).toBeInTheDocument();
  expect(screen.getByText("TerraForge is a sandbox for making worlds.")).toBeInTheDocument();
  expect(screen.getByText("Visit real exoplanets.")).toBeInTheDocument();

  // Features
  expect(screen.getByRole("heading", { level: 2, name: "Features" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 3, name: "Procedural planets" })).toBeInTheDocument();

  // Store card: price, CTA, launch alert, fact list (once; the phone accordion is a separate slot)
  const store = screen.getByRole("complementary", { name: "Get the game" });
  expect(within(store).getByText("Free")).toBeInTheDocument();
  expect(within(store).getByRole("link", { name: "Play in browser" })).toHaveAttribute("href", "https://www.terraforgeworlds.com");
  expect(within(store).getByText("Android · coming soon")).toBeInTheDocument();
  expect(within(store).queryByRole("list", { name: "App stores" })).toBeNull();
  expect(within(store).getByRole("button", { name: "Notify me" })).toBeInTheDocument();
  expect(store.querySelector('input[name="game"]')).toHaveValue("terraforge");
  expect(store.querySelector('input[name="platform"]')).toHaveValue("android");
  const facts = store.querySelector("dl")!;
  expect(within(facts as HTMLElement).getByText("Developer")).toBeInTheDocument();
  expect(within(facts as HTMLElement).getByText("inkOrange Studios")).toBeInTheDocument();
  expect(store.querySelector("details")).toBeNull();
  expect(container.querySelector('[data-slot="details"] details summary')).toHaveTextContent("Game details");

  // Latest updates
  expect(screen.getByRole("heading", { level: 2, name: "Latest updates" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "All TerraForge news →" })).toHaveAttribute("href", "/news?game=terraforge");
  expect(screen.getByRole("link", { name: /New exoplanet data/ })).toHaveAttribute("href", "/news/exoplanets-update");
  expect(screen.getByRole("link", { name: /Patch 1\.2/ })).toHaveAttribute("href", "/news/patch-1-2");

  // Press + help
  expect(screen.getByText("Press kit")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Download →" })).toHaveAttribute("href", "https://inkorangestudios.com/press/terraforge.zip");
  expect(screen.getByRole("link", { name: "Get support →" })).toHaveAttribute("href", "/support");

  // More from inkOrange: other games only
  expect(screen.getByRole("heading", { level: 2, name: "More from inkOrange" })).toBeInTheDocument();
  const more = screen.getByRole("list", { name: "More games" });
  expect(within(more).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(["/games/mission-control"]);

  // JSON-LD
  const ld = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent ?? "");
  expect(ld).toMatchObject({
    "@type": "VideoGame",
    name: "TerraForge",
    description: "Build planets and entire star systems.",
    genre: ["Sandbox", "Creative"],
    gamePlatform: ["Web"],
    publisher: { "@type": "Organization", name: "inkOrange Studios" },
    url: "https://www.inkorangestudios.com/games/terraforge",
    image: full.keyArt!.src,
  });

  expect(visibleText(container)).not.toContain("[");
});

describe("key art and store links", () => {
  beforeEach(() => {
    content.getPosts.mockResolvedValue([]);
    content.getGames.mockResolvedValue([]);
  });

  it("shows right under the title when there is no trailer, above any screenshots", async () => {
    content.getGame.mockResolvedValue({ ...full, media: full.media.filter((m) => m.kind !== "trailer") });
    const { container } = render(await GamePage(params("terraforge")));
    const art = container.querySelector('[data-slot="art"]')!;
    expect(within(art as HTMLElement).getByAltText("TerraForge key art")).toHaveAttribute("src", full.keyArt!.src);
    expect(art.previousElementSibling).toHaveAttribute("data-slot", "title");
    expect(art.nextElementSibling).toHaveAttribute("data-slot", "media");
  });

  it("store links alone are enough for a store card with their badges", async () => {
    content.getGame.mockResolvedValue({
      ...sparse,
      platforms: ["iOS"],
      stores: [{ platform: "iOS", href: "https://apps.apple.com/app/id1" }],
    });
    render(await GamePage(params("terraforge")));
    const store = screen.getByRole("complementary", { name: "Get the game" });
    expect(within(store).getByRole("link", { name: "Download on the App Store" })).toHaveAttribute("href", "https://apps.apple.com/app/id1");
  });

  it("is left out when the game has no key art", async () => {
    content.getGame.mockResolvedValue({ ...full, keyArt: null, media: [] });
    const { container } = render(await GamePage(params("terraforge")));
    expect(container.querySelector('[data-slot="art"]')).toBeNull();
  });
});

describe("beta tester band", () => {
  const renderWith = async (game: Game) => {
    content.getGame.mockResolvedValue(game);
    content.getPosts.mockResolvedValue([]);
    content.getGames.mockResolvedValue([]);
    return render(await GamePage(params(game.slug)));
  };
  const band = () => screen.queryByText(/NOW RECRUITING TESTERS|BETA TESTING/)?.closest("section") ?? null;

  it("shows nothing when the signup is No", async () => {
    await renderWith({ ...full, beta: null });
    expect(band()).toBeNull();
    expect(screen.queryByRole("button", { name: "Join the beta" })).toBeNull();
  });

  it("Yes shows the signup for this game, tagged as from the game page", async () => {
    await renderWith({ ...full, beta: { state: "open", platforms: ["ios", "android"], title: null, body: null } });
    const b = band()!;
    expect(within(b).getByText("Play TerraForge before anyone else.")).toBeInTheDocument();
    expect(within(b).getByText("Join the beta and help shape the game before launch.")).toBeInTheDocument();
    expect(within(b).getByRole("button", { name: "Join the beta" })).toBeInTheDocument();
    expect(within(b).getByRole("combobox", { name: "Platform" })).toHaveTextContent("iOS");
    expect(b.querySelector('input[name="game"]')).toHaveValue("terraforge");
    expect(b.querySelector('input[name="source"]')).toHaveValue("game-page");
  });

  it("uses the Studio's title and body when set", async () => {
    await renderWith({ ...full, beta: { state: "open", platforms: ["android"], title: "Test it first", body: "Android only." } });
    const b = band()!;
    expect(within(b).getByText("Test it first")).toBeInTheDocument();
    expect(within(b).getByText("Android only.")).toBeInTheDocument();
    expect(b.querySelector('input[name="platform"]')).toHaveValue("android");
  });

  it("Closed says testing is over and links to the game, with no form", async () => {
    await renderWith({ ...full, beta: { state: "closed", title: null, body: null } });
    const b = band()!;
    expect(within(b).getByText("Testing is now closed.")).toBeInTheDocument();
    expect(within(b).getByText("Thanks to everyone who helped test TerraForge. General release is open.")).toBeInTheDocument();
    expect(within(b).getByRole("link", { name: "Play in browser" })).toHaveAttribute("href", "https://www.terraforgeworlds.com");
    expect(within(b).queryByRole("textbox")).toBeNull();
  });

  it("Closed without a call to action is just the notice", async () => {
    await renderWith({ ...full, primaryCta: null, beta: { state: "closed", title: null, body: null } });
    const b = band()!;
    expect(within(b).getByText("Testing is now closed.")).toBeInTheDocument();
    expect(within(b).queryByRole("link")).toBeNull();
  });
});
