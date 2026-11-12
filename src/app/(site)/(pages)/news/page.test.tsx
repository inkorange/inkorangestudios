import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { PostSummary } from "@/lib/sanity/types";

const content = vi.hoisted(() => ({ getPosts: vi.fn() }));
vi.mock("@/lib/sanity/content", () => content);

import News, { metadata, revalidate } from "./page";

const tf = { slug: "terraforge", name: "TerraForge" };
const sc = { slug: "space-cowboy", name: "Space Cowboy" };
const post = (slug: string, title: string, game: PostSummary["game"]): PostSummary => ({
  format: "article",
  slug,
  title,
  date: "2026-11-05",
  kind: "devlog",
  excerpt: null,
  image: null,
  game,
});
const posts = [post("a", "Terrain tools", tf), post("b", "Saddle up", sc), post("c", "Studio news", null), post("d", "Biomes", tf)];

const page = async (game?: string | string[]) => render(await News({ searchParams: Promise.resolve(game === undefined ? {} : { game }) }));

beforeEach(() => content.getPosts.mockReset());

it("revalidates hourly and has a title", () => {
  expect(revalidate).toBe(3600);
  expect(metadata.title).toBe("News — inkOrange Studios");
});

it("lists every post as a card under the News h1", async () => {
  content.getPosts.mockResolvedValue(posts);
  await page();
  expect(screen.getByRole("heading", { level: 1, name: "News" })).toBeInTheDocument();
  expect(content.getPosts).toHaveBeenCalledWith();
  for (const title of ["Terrain tools", "Saddle up", "Studio news", "Biomes"]) {
    expect(screen.getByRole("link", { name: new RegExp(title) })).toBeInTheDocument();
  }
  expect(screen.getByRole("link", { name: /Terrain tools/ })).toHaveAttribute("href", "/news/a");
});

it("offers a filter pill per game that has posts, with All selected", async () => {
  content.getPosts.mockResolvedValue(posts);
  await page();
  const nav = screen.getByRole("navigation", { name: "Filter news by game" });
  const links = within(nav).getAllByRole("link");
  expect(links.map((l) => l.textContent)).toEqual(["All", "TerraForge", "Space Cowboy"]);
  expect(within(nav).getByRole("link", { name: "All" })).toHaveAttribute("aria-current", "page");
  expect(within(nav).getByRole("link", { name: "TerraForge" })).toHaveAttribute("href", "/news?game=terraforge");
});

it("?game= shows only that game's posts and selects its pill", async () => {
  content.getPosts.mockResolvedValue(posts);
  await page("terraforge");
  expect(screen.getByRole("link", { name: /Terrain tools/ })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Biomes/ })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /Saddle up/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /Studio news/ })).not.toBeInTheDocument();
  const nav = screen.getByRole("navigation", { name: "Filter news by game" });
  expect(within(nav).getByRole("link", { name: "TerraForge" })).toHaveAttribute("aria-current", "page");
  expect(within(nav).getByRole("link", { name: "All" })).not.toHaveAttribute("aria-current");
});

it("ignores an unknown or repeated ?game= and shows everything", async () => {
  content.getPosts.mockResolvedValue(posts);
  await page("nope");
  expect(screen.getAllByRole("link", { name: /DEVLOG/ })).toHaveLength(4);
  content.getPosts.mockResolvedValue(posts);
  document.body.innerHTML = "";
  await page(["terraforge", "space-cowboy"]);
  expect(screen.getAllByRole("link", { name: /DEVLOG/ })).toHaveLength(4);
});

it("with no posts shows the empty state and no filter", async () => {
  content.getPosts.mockResolvedValue([]);
  await page();
  expect(screen.getByText("No news yet.")).toBeInTheDocument();
  expect(screen.queryByRole("navigation", { name: "Filter news by game" })).not.toBeInTheDocument();
});

it("lists a link post beside articles, linking out, and filters it by its game", async () => {
  const link: PostSummary = {
    format: "link",
    id: "l1",
    url: "https://www.chriswest.tech/article/space-cowboy",
    source: "chriswest.tech",
    title: "From web app to app store",
    date: "2026-10-28",
    kind: "update",
    excerpt: null,
    image: null,
    game: sc,
  };
  content.getPosts.mockResolvedValue([...posts, link]);
  await page("space-cowboy");
  const card = screen.getByRole("link", { name: /From web app to app store/ });
  expect(card).toHaveAttribute("href", "https://www.chriswest.tech/article/space-cowboy");
  expect(card).toHaveAttribute("target", "_blank");
  expect(screen.getByRole("link", { name: /Saddle up/ })).toHaveAttribute("href", "/news/b");
  expect(screen.queryByRole("link", { name: /Terrain tools/ })).toBeNull();
});
