import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { Game } from "@/lib/sanity/types";

const content = vi.hoisted(() => ({ getGame: vi.fn(), getGames: vi.fn() }));
vi.mock("@/lib/sanity/content", () => content);
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

import BetaPage, { generateMetadata, generateStaticParams, revalidate } from "./page";

const keyArt = { src: "https://cdn.sanity.io/images/p/d/key-1600x900.png", alt: "Space Cowboy key art", width: 1600, height: 900 };
const open = {
  state: "open" as const,
  platforms: ["android"],
  title: null,
  body: null,
  perk: "Testers get the full game free.",
  why: {
    title: "Help us bring Space Cowboy to life.",
    body: "We're a tiny studio.",
    reasons: [
      { title: "Shape the game", body: "Your feedback decides what we fix." },
      { title: "Catch the bugs", body: "Every phone is different." },
    ],
  },
};
const game: Game = {
  slug: "space-cowboy",
  name: "Space Cowboy",
  status: "in-development",
  genres: ["Puzzle"],
  platforms: ["Android"],
  stores: [],
  blurb: "Plan the perfect shot.",
  description: [],
  appIcon: null,
  keyArt,
  coverArt: null,
  media: [{ kind: "image", label: "Splash screen", image: keyArt }],
  features: [{ title: "Real gravity", body: "Slingshot round planets." }],
  facts: [],
  priceLabel: null,
  primaryCta: null,
  notify: null,
  beta: open,
  pressKitUrl: null,
  featured: false,
};

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });
const page = async (g: Game | null) => {
  content.getGame.mockResolvedValue(g);
  return render(await BetaPage(params("space-cowboy")));
};

beforeEach(() => vi.clearAllMocks());

it("revalidates hourly and prerenders a page per game", async () => {
  expect(revalidate).toBe(3600);
  content.getGames.mockResolvedValue([{ slug: "space-cowboy" }, { slug: "terraforge" }]);
  expect(await generateStaticParams()).toEqual([{ slug: "space-cowboy" }, { slug: "terraforge" }]);
});

it("has a share title, the game's pitch and its key art as the preview", async () => {
  content.getGame.mockResolvedValue(game);
  const meta = await generateMetadata(params("space-cowboy"));
  expect(meta.title).toBe("Become a Space Cowboy beta tester — inkOrange Studios");
  expect(meta.description).toBe("Plan the perfect shot.");
  expect(meta.alternates).toEqual({ canonical: "/beta/space-cowboy" });
  expect(meta.openGraph?.images).toEqual([expect.objectContaining({ url: keyArt.src })]);
});

it("is not found for an unknown game or one without a tester signup", async () => {
  await expect(page(null)).rejects.toThrow("NEXT_NOT_FOUND");
  await expect(page({ ...game, beta: null })).rejects.toThrow("NEXT_NOT_FOUND");
  content.getGame.mockResolvedValue({ ...game, beta: null });
  expect((await generateMetadata(params("space-cowboy"))).robots).toEqual({ index: false, follow: true });
});

it("leads with the Android notice, the pitch, the reward and a tester signup tagged as from this page", async () => {
  const { container } = await page(game);
  expect(screen.getByText("Android only for now. Sign up with the Google account you use for the Play Store on your Android phone.")).toBeInTheDocument();
  expect(screen.getByText("FROM THE MAKERS OF TERRAFORGE")).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1, name: "Play Space Cowboy before anyone else." })).toBeInTheDocument();
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByText("Plan the perfect shot.")).toBeInTheDocument();
  expect(screen.getByText("Testers get the full game free.")).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Your Google Play email" })).toHaveAttribute("placeholder", "you@gmail.com");
  expect(screen.getAllByRole("button", { name: "Become a tester" })).toHaveLength(1);
  expect(container.querySelector('input[name="game"]')).toHaveValue("space-cowboy");
  expect(container.querySelector('input[name="source"]')).toHaveValue("beta-page");
  expect(container.querySelector('input[name="platform"]')).toHaveValue("android");
  expect(screen.getByText("We'll add you to the test and email you a link to install it from Google Play.")).toBeInTheDocument();
});

it("explains why testers are needed, then shows the screenshots, features and a link to the game", async () => {
  await page(game);
  expect(screen.getByRole("heading", { level: 2, name: "Help us bring Space Cowboy to life." })).toBeInTheDocument();
  expect(screen.getByText("We're a tiny studio.")).toBeInTheDocument();
  const reasons = screen.getAllByRole("list").find((l) => within(l).queryByText("Shape the game"))!;
  expect(within(reasons).getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getByRole("heading", { level: 2, name: "Screenshots" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 2, name: "Why play Space Cowboy" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "More about Space Cowboy →" })).toHaveAttribute("href", "/games/space-cowboy");
});

it("hides the reward, the why section and the extras when they are empty", async () => {
  await page({ ...game, media: [], features: [], beta: { ...open, perk: null, why: null } });
  expect(screen.queryByText("Testers get the full game free.")).toBeNull();
  expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
  expect(screen.queryByRole("link", { name: /More about/ })).toBeNull();
});

it("uses the Studio's title, and has no notice when both phones are open", async () => {
  await page({ ...game, beta: { ...open, platforms: ["ios", "android"], title: "Test it first." } });
  expect(screen.getByRole("heading", { level: 1, name: "Test it first." })).toBeInTheDocument();
  expect(screen.queryByText(/only for now/)).toBeNull();
  expect(screen.getByRole("combobox", { name: "Platform" })).toBeInTheDocument();
});

it("once testing has closed, says so and links to the game with no form", async () => {
  await page({ ...game, beta: { state: "closed", title: null, body: null } });
  expect(screen.getByRole("heading", { level: 1, name: "Testing is now closed." })).toBeInTheDocument();
  expect(screen.getByText("Thanks to everyone who helped test Space Cowboy.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "See Space Cowboy" })).toHaveAttribute("href", "/games/space-cowboy");
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(screen.queryByText(/only for now/)).toBeNull();
  expect(screen.queryByRole("heading", { name: "Help us bring Space Cowboy to life." })).toBeNull();
});
