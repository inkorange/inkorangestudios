import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { GameSummary, Post } from "@/lib/sanity/types";

const content = vi.hoisted(() => ({ getPost: vi.fn(), getPosts: vi.fn(), getGames: vi.fn() }));
vi.mock("@/lib/sanity/content", () => content);
const nav = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("next/navigation", () => nav);
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import PostPage, { dynamicParams, generateMetadata, generateStaticParams, revalidate } from "./page";

const body = [{ _type: "block", _key: "a", style: "normal", markDefs: [], children: [{ _type: "span", _key: "s", text: "We rebuilt the terrain brush.", marks: [] }] }];
const post: Post = {
  slug: "terrain-tools",
  title: "New terrain tools",
  date: "2026-11-05T09:00:00Z",
  kind: "patch-notes",
  excerpt: "Brushes, biomes and more.",
  image: { src: "/cover.jpg", alt: "The new terrain brush", width: 1600, height: 900 },
  game: { slug: "terraforge", name: "TerraForge" },
  body,
};
const terraforge: GameSummary = { slug: "terraforge", name: "TerraForge", status: "out-now", genre: "Sandbox", platformLabel: "Web", cover: null };

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  content.getPost.mockReset();
  content.getGames.mockResolvedValue([terraforge]);
  content.getPosts.mockResolvedValue([post]);
});

it("revalidates hourly and prebuilds every post", async () => {
  expect(revalidate).toBe(3600);
  expect(dynamicParams).toBe(true);
  expect(await generateStaticParams()).toEqual([{ slug: "terrain-tools" }]);
});

it("renders the date and kind, the h1, the cover, the body and the related game", async () => {
  content.getPost.mockResolvedValue(post);
  render(await PostPage(params("terrain-tools")));
  expect(content.getPost).toHaveBeenCalledWith("terrain-tools");
  const date = screen.getByText("NOV 5, 2026");
  expect(date.tagName).toBe("TIME");
  expect(date).toHaveAttribute("dateTime", "2026-11-05T09:00:00Z");
  expect(date.closest("p")).toHaveTextContent("NOV 5, 2026 · PATCH NOTES");
  expect(screen.getByRole("heading", { level: 1, name: "New terrain tools" })).toBeInTheDocument();
  expect(screen.getByAltText("The new terrain brush")).toBeInTheDocument();
  expect(screen.getByText("We rebuilt the terrain brush.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /TerraForge.*Sandbox · Web/ })).toHaveAttribute("href", "/games/terraforge");
  expect(screen.getByRole("link", { name: "News" })).toHaveAttribute("href", "/news");
});

it("a sparse post shows no cover, falls back to the excerpt and drops the game block", async () => {
  content.getPost.mockResolvedValue({ ...post, image: null, body: [], game: null });
  render(await PostPage(params("terrain-tools")));
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.getByText("Brushes, biomes and more.")).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "The game" })).not.toBeInTheDocument();
});

it("describes the post as a BlogPosting", async () => {
  content.getPost.mockResolvedValue(post);
  content.getGames.mockResolvedValue([]);
  const { container } = render(await PostPage(params("terrain-tools")));
  const ld = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent ?? "");
  expect(ld).toMatchObject({ "@type": "BlogPosting", headline: "New terrain tools", url: "https://www.inkorangestudios.com/news/terrain-tools" });
});

it("calls notFound for a missing post", async () => {
  content.getPost.mockResolvedValue(null);
  await expect(PostPage(params("nope"))).rejects.toThrow("NEXT_NOT_FOUND");
  expect(nav.notFound).toHaveBeenCalled();
});

it("builds metadata from the post", async () => {
  content.getPost.mockResolvedValue(post);
  const meta = await generateMetadata(params("terrain-tools"));
  expect(meta.title).toBe("New terrain tools — inkOrange Studios");
  expect(meta.description).toBe("Brushes, biomes and more.");
  expect(meta.alternates).toEqual({ canonical: "/news/terrain-tools" });
  expect(meta.openGraph).toMatchObject({
    type: "article",
    url: "/news/terrain-tools",
    siteName: "inkOrange Studios",
    publishedTime: post.date,
    images: [{ url: "/cover.jpg", width: 1600, height: 900, alt: "The new terrain brush" }],
  });
  content.getPost.mockResolvedValue(null);
  expect(await generateMetadata(params("nope"))).toEqual({
    title: "Page not found — inkOrange Studios",
    robots: { index: false, follow: true },
  });
});
