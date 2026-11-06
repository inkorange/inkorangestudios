import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const env = vi.hoisted(() => ({ sanityProjectId: "", sanityDataset: "production" }));
vi.mock("@/lib/env", () => ({ publicEnv: env }));

import { apiVersion, getSanityClient, getSanityWriteClient, sanityFetch } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("without a project id", () => {
  beforeEach(() => {
    env.sanityProjectId = "";
  });
  it("throws a clear error", async () => {
    expect(() => getSanityClient()).toThrow(/NEXT_PUBLIC_SANITY_PROJECT_ID/);
    await expect(sanityFetch("*[0]")).rejects.toThrow(/NEXT_PUBLIC_SANITY_PROJECT_ID/);
  });
});

describe("with a project id", () => {
  beforeEach(() => {
    env.sanityProjectId = "abc123";
  });

  it("builds a CDN client with no token", () => {
    const cfg = getSanityClient().config();
    expect(cfg).toMatchObject({
      projectId: "abc123",
      dataset: "production",
      apiVersion,
      useCdn: true,
    });
    expect(cfg.token).toBeUndefined();
  });

  it("sanityFetch passes next.tags through and sends no token", async () => {
    vi.stubEnv("SANITY_API_TOKEN", "secret");
    const fetchMock = vi.fn(async () => Response.json({ result: [1, 2], ms: 1 }));
    vi.stubGlobal("fetch", fetchMock);
    const out = await sanityFetch<number[]>("*[_type=='studioGame']", {}, ["games"]);
    expect(out).toEqual([1, 2]);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string | Request, RequestInit & { next?: { tags?: string[] } }];
    expect(String(url)).toContain("apicdn.sanity.io");
    expect(init.next?.tags).toEqual(["games"]);
    expect(JSON.stringify(init.headers ?? {})).not.toContain("secret");
  });

  it("write client uses the trimmed token, no CDN", () => {
    vi.stubEnv("SANITY_API_TOKEN", "  tok  ");
    const cfg = getSanityWriteClient().config();
    expect(cfg.token).toBe("tok");
    expect(cfg.useCdn).toBe(false);
  });

  it("write client throws when the token is missing or blank", () => {
    vi.stubEnv("SANITY_API_TOKEN", "   ");
    expect(() => getSanityWriteClient()).toThrow(/SANITY_API_TOKEN/);
  });
});
