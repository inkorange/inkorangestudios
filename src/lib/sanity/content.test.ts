import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("./client", () => ({ sanityFetch: fetchMock }));
const env = vi.hoisted(() => ({ sanityProjectId: "abc123", sanityDataset: "production" }));
vi.mock("@/lib/env", () => ({
  publicEnv: env,
  readServerEnv: () => ({}),
}));

import { getFaqs, getFeatured, getGame, getGames, getGameSlugs, getLegalPage, getPost, getPosts, getSettings, getTools } from "./content";

const defaults = { supportEmail: null, socialLinks: [], betaCallout: null, newsletterBlurb: null, studioPhoto: null, foundedLine: null };
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchMock.mockReset();
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  errorSpy.mockRestore();
});

const everyRead: [string, () => Promise<unknown>][] = [
  ["getGames", () => getGames()],
  ["getFeatured", () => getFeatured()],
  ["getGame", () => getGame("x")],
  ["getGameSlugs", () => getGameSlugs()],
  ["getPosts", () => getPosts()],
  ["getPost", () => getPost("x")],
  ["getLegalPage", () => getLegalPage("privacy")],
  ["getFaqs", () => getFaqs()],
  ["getSettings", () => getSettings()],
  ["getTools", () => getTools()],
];

/** Leave the test environment: no VITEST flag, the given NODE_ENV and build phase. */
function outsideTests(nodeEnv: "production" | "development", phase?: string) {
  vi.stubEnv("VITEST", "");
  vi.stubEnv("NODE_ENV", nodeEnv);
  vi.stubEnv("NEXT_PHASE", phase ?? "");
}

describe("at runtime (not the build), a Sanity failure is rethrown so ISR keeps the last good page", () => {
  beforeEach(() => {
    fetchMock.mockRejectedValue(new Error("boom"));
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each([["production"], ["development"]] as const)("%s server: every read rethrows", async (nodeEnv) => {
    outsideTests(nodeEnv);
    for (const [name, run] of everyRead) {
      await expect(run(), name).rejects.toThrow("boom");
    }
  });
});

describe("during next build (NEXT_PHASE=phase-production-build)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    env.sanityProjectId = "abc123";
  });

  it("swallows fetch errors: empty content renders empty states (Review Focus 4)", async () => {
    outsideTests("production", "phase-production-build");
    fetchMock.mockRejectedValue(new Error("boom"));
    expect(await getGames()).toEqual([]);
    expect(await getGame("x")).toBeNull();
    expect(await getSettings()).toEqual(defaults);
    expect(errorSpy).toHaveBeenCalledTimes(3);
  });

  it("fails loudly when NEXT_PUBLIC_SANITY_PROJECT_ID is missing in a production build", async () => {
    outsideTests("production", "phase-production-build");
    env.sanityProjectId = "";
    for (const [name, run] of everyRead) {
      await expect(run(), name).rejects.toThrow(/NEXT_PUBLIC_SANITY_PROJECT_ID/);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("in tests, when sanity is unreachable", () => {
  beforeEach(() => {
    fetchMock.mockRejectedValue(new Error("boom"));
  });
  afterEach(() => {
    env.sanityProjectId = "abc123";
  });

  it("a missing project id is not fatal", async () => {
    env.sanityProjectId = "";
    fetchMock.mockRejectedValueOnce(new Error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set"));
    expect(await getGames()).toEqual([]);
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
      ["getTools", () => getTools(), []],
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
  it("getTools maps, drops unnamed rows and tags the fetch", async () => {
    fetchMock.mockResolvedValue([{ name: "Molecular", status: "out-now", url: "https://m.example.com" }, { status: "out-now" }]);
    expect((await getTools()).map((t) => t.name)).toEqual(["Molecular"]);
    const [query, , tags] = fetchMock.mock.calls[0];
    expect(query).toContain('_type == "studioTool"');
    expect(query).toContain("coalesce(sortOrder, 9999) asc, name asc");
    expect(tags).toEqual(["studioTool"]);
  });

  it("getGames maps, drops invalid rows and tags the fetch", async () => {
    fetchMock.mockResolvedValue([{ slug: "a", name: "A", status: "out-now" }, { name: "no slug" }]);
    const games = await getGames();
    expect(games.map((g) => g.slug)).toEqual(["a"]);
    const [query, , tags] = fetchMock.mock.calls[0];
    expect(query).toContain("coalesce(sortOrder, 9999) asc, name asc");
    expect(tags).toEqual(["studioGame"]);
  });

  it("getFeatured orders by featuredOrder", async () => {
    fetchMock.mockResolvedValue([{ slug: "a", name: "A", genres: ["Sim"] }]);
    const f = await getFeatured();
    expect(f[0]).toMatchObject({ genre: "SIM", detailHref: "/games/a" });
    expect(fetchMock.mock.calls[0][0]).toContain("coalesce(featuredOrder, 9999) asc");
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
    expect(tags).toEqual(["studioPost", "studioGame"]);
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
    expect(fetchMock.mock.calls[0][2]).toEqual(["studioPost", "studioGame"]);
    fetchMock.mockResolvedValueOnce({ slug: "privacy", title: "Privacy" });
    expect((await getLegalPage("privacy"))?.title).toBe("Privacy");
    expect(fetchMock.mock.calls[1][2]).toEqual(["studioPage"]);
    fetchMock.mockResolvedValueOnce([{ _id: "1", question: "Q?" }]);
    expect(await getFaqs()).toHaveLength(1);
    expect(fetchMock.mock.calls[2][2]).toEqual(["studioFaq", "studioGame"]);
    fetchMock.mockResolvedValueOnce({ supportEmail: "a@b.test" });
    expect((await getSettings()).supportEmail).toBe("a@b.test");
    expect(fetchMock.mock.calls[3][2]).toEqual(["studioSettings", "studioGame"]);
  });
});
