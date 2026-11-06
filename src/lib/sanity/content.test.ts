import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("./client", () => ({ sanityFetch: fetchMock }));
vi.mock("@/lib/env", () => ({
  publicEnv: { sanityProjectId: "abc123", sanityDataset: "production" },
  readServerEnv: () => ({}),
}));

import { getFaqs, getFeatured, getGame, getGames, getGameSlugs, getLegalPage, getPost, getPosts, getSettings } from "./content";

const defaults = { supportEmail: null, socialLinks: [], betaCallout: null, newsletterBlurb: null, studioPhoto: null, foundedLine: null };
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchMock.mockReset();
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  errorSpy.mockRestore();
});

describe("when sanity is unreachable", () => {
  beforeEach(() => {
    fetchMock.mockRejectedValue(new Error("boom"));
  });

  it("returns empty values and logs once per call", async () => {
    const steps: [string, () => Promise<unknown>, unknown][] = [
      ["getGames", () => getGames(), []],
      ["getFeatured", () => getFeatured(), []],
      ["getGame", () => getGame("x"), null],
      ["getGameSlugs", () => getGameSlugs(), []],
      ["getPosts", () => getPosts(), []],
      ["getPost", () => getPost("x"), null],
      ["getLegalPage", () => getLegalPage("privacy"), null],
      ["getFaqs", () => getFaqs(), []],
      ["getSettings", () => getSettings(), defaults],
    ];
    for (const [name, run, empty] of steps) {
      errorSpy.mockClear();
      expect(await run(), name).toEqual(empty);
      expect(errorSpy, name).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0]).toBe(`[content] ${name} failed`);
    }
  });
});

describe("when sanity returns nothing", () => {
  it("handles null and empty results", async () => {
    fetchMock.mockResolvedValue(null);
    expect(await getGames()).toEqual([]);
    expect(await getGame("x")).toBeNull();
    expect(await getSettings()).toEqual(defaults);
    fetchMock.mockResolvedValue([]);
    expect(await getFeatured()).toEqual([]);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

describe("with data", () => {
  it("getGames maps, drops invalid rows and tags the fetch", async () => {
    fetchMock.mockResolvedValue([{ slug: "a", name: "A", status: "out-now" }, { name: "no slug" }]);
    const games = await getGames();
    expect(games.map((g) => g.slug)).toEqual(["a"]);
    const [query, , tags] = fetchMock.mock.calls[0];
    expect(query).toContain("sortOrder asc, name asc");
    expect(tags).toEqual(["studioGame"]);
  });

  it("getFeatured orders by featuredOrder", async () => {
    fetchMock.mockResolvedValue([{ slug: "a", name: "A", genres: ["Sim"] }]);
    const f = await getFeatured();
    expect(f[0]).toMatchObject({ genre: "SIM", detailHref: "/games/a" });
    expect(fetchMock.mock.calls[0][0]).toContain("featuredOrder asc");
  });

  it("getGame passes the slug param; getGameSlugs filters blanks", async () => {
    fetchMock.mockResolvedValueOnce({ slug: "a", name: "A" });
    expect((await getGame("a"))?.name).toBe("A");
    expect(fetchMock.mock.calls[0][1]).toEqual({ slug: "a" });
    fetchMock.mockResolvedValueOnce(["a", "", null, "b"]);
    expect(await getGameSlugs()).toEqual(["a", "b"]);
  });

  it("getPosts applies limit and game filter", async () => {
    fetchMock.mockResolvedValue([{ slug: "p", title: "P", date: "2026-01-01" }]);
    expect(await getPosts(3, "terraforge")).toHaveLength(1);
    const [query, params, tags] = fetchMock.mock.calls[0];
    expect(query).toContain("date desc");
    expect(query).toContain("game->slug.current == $gameSlug");
    expect(query).toContain("[0...3]");
    expect(params).toEqual({ gameSlug: "terraforge" });
    expect(tags).toEqual(["studioPost"]);
  });

  it("getPosts without args has no filter and no slice", async () => {
    fetchMock.mockResolvedValue([]);
    await getPosts();
    expect(fetchMock.mock.calls[0][0]).not.toContain("$gameSlug");
    expect(fetchMock.mock.calls[0][0]).not.toContain("[0...");
    expect(fetchMock.mock.calls[0][1]).toEqual({});
  });

  it("getPost, getLegalPage, getFaqs, getSettings use their tags", async () => {
    fetchMock.mockResolvedValueOnce({ slug: "p", title: "P", date: "2026-01-01" });
    expect((await getPost("p"))?.title).toBe("P");
    expect(fetchMock.mock.calls[0][2]).toEqual(["studioPost"]);
    fetchMock.mockResolvedValueOnce({ slug: "privacy", title: "Privacy" });
    expect((await getLegalPage("privacy"))?.title).toBe("Privacy");
    expect(fetchMock.mock.calls[1][2]).toEqual(["studioPage"]);
    fetchMock.mockResolvedValueOnce([{ _id: "1", question: "Q?" }]);
    expect(await getFaqs()).toHaveLength(1);
    expect(fetchMock.mock.calls[2][2]).toEqual(["studioFaq"]);
    fetchMock.mockResolvedValueOnce({ supportEmail: "a@b.test" });
    expect((await getSettings()).supportEmail).toBe("a@b.test");
    expect(fetchMock.mock.calls[3][2]).toEqual(["studioSettings"]);
  });
});
