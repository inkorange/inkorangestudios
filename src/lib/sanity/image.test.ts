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

describe("toImageRef crop and hotspot", () => {
  const ref = "image-a1b2c3d4-2000x1000-jpg";
  const crop = { top: 0, bottom: 0.5, left: 0.25, right: 0.25 };
  const hotspot = { x: 0.5, y: 0.25, width: 0.5, height: 0.5 };

  it("passes the crop to the URL builder and sizes the cropped region", () => {
    const r = toImageRef({ alt: "Hero", asset: { _ref: ref }, crop, hotspot }, 800);
    // Cropped region: 1000 x 500 of the 2000 x 1000 source.
    expect(r!.src).toContain("rect=500,0,1000,500");
    expect(r).toMatchObject({ width: 800, height: 400 });
  });

  it("ignores a crop/hotspot that isn't the right shape", () => {
    const r = toImageRef({ alt: "Hero", asset: { _ref: ref }, crop: "bad", hotspot: null }, 800);
    expect(r!.src).not.toContain("rect=");
    expect(r?.height).toBe(400);
  });
});
