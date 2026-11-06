import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  publicEnv: { sanityProjectId: "abc123", sanityDataset: "production" },
  readServerEnv: () => ({}),
}));

import { toImageRef } from "./image";

describe("toImageRef", () => {
  const ref = "image-a1b2c3d4-2000x1000-jpg";
  it("derives height from the _ref dimensions", () => {
    const r = toImageRef({ alt: "Hero", asset: { _ref: ref } }, 800);
    expect(r).toMatchObject({ alt: "Hero", width: 800, height: 400 });
    expect(r!.src).toContain("cdn.sanity.io/images/abc123/production/");
  });
  it("prefers explicit dimensions", () => {
    const r = toImageRef(
      { alt: "x", asset: { _ref: ref, metadata: { dimensions: { width: 100, height: 100 } } } },
      50,
    );
    expect(r?.height).toBe(50);
  });
  it("returns null without asset or alt", () => {
    expect(toImageRef(null, 100)).toBeNull();
    expect(toImageRef({ alt: "x" }, 100)).toBeNull();
    expect(toImageRef({ asset: { _ref: ref } }, 100)).toBeNull();
    expect(toImageRef({ alt: "  ", asset: { _ref: ref } }, 100)).toBeNull();
  });
});
