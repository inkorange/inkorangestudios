// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";

const content = vi.hoisted(() => ({ getGameSlugs: vi.fn(), getPosts: vi.fn(), getLegalPage: vi.fn() }));
vi.mock("@/lib/sanity/content", () => content);
vi.mock("@/lib/env", () => ({ publicEnv: { siteUrl: "https://inkorangestudios.com" } }));

import sitemap, { revalidate } from "./sitemap";

const block = [{ _type: "block", _key: "a", children: [{ _type: "span", _key: "s", text: "Terms." }] }];

beforeEach(() => {
  content.getGameSlugs.mockResolvedValue(["terraforge", "space-cowboy"]);
  content.getPosts.mockResolvedValue([{ slug: "devlog-1", date: "2026-11-01", title: "Devlog", kind: "devlog", excerpt: null, image: null, game: null }]);
  content.getLegalPage.mockImplementation(async (slug: string) =>
    slug === "terms" ? { slug, title: "Terms", updatedAt: "2026-11-02", body: block } : null,
  );
});

const urls = async () => (await sitemap()).map((e) => e.url);

it("revalidates hourly", () => expect(revalidate).toBe(3600));

it("lists the static pages, every game and every post on the site URL", async () => {
  expect(await urls()).toEqual(
    expect.arrayContaining([
      "https://inkorangestudios.com/",
      "https://inkorangestudios.com/about",
      "https://inkorangestudios.com/learn",
      "https://inkorangestudios.com/support",
      "https://inkorangestudios.com/news",
      "https://inkorangestudios.com/games/terraforge",
      "https://inkorangestudios.com/games/space-cowboy",
      "https://inkorangestudios.com/news/devlog-1",
    ]),
  );
});

it("includes legal pages only when they have content", async () => {
  const list = await urls();
  expect(list).not.toContain("https://inkorangestudios.com/privacy");
  expect(list).toContain("https://inkorangestudios.com/terms");
});

it("omits a legal page whose body is empty", async () => {
  content.getLegalPage.mockResolvedValue({ slug: "terms", title: "Terms", updatedAt: null, body: [] });
  expect(await urls()).not.toContain("https://inkorangestudios.com/terms");
});

it("dates posts and legal pages, and never lists /design, /studio or /api", async () => {
  const entries = await sitemap();
  expect(entries.find((e) => e.url.endsWith("/news/devlog-1"))?.lastModified).toBe("2026-11-01");
  expect(entries.find((e) => e.url.endsWith("/terms"))?.lastModified).toBe("2026-11-02");
  expect(entries.some((e) => /\/(design|studio|api)/.test(e.url))).toBe(false);
});
