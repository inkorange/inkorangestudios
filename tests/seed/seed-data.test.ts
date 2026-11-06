import { describe, expect, it } from "vitest";
import { buildDocuments } from "../../scripts/seed-data.mjs";

type Doc = { _id: string; _type: string; [k: string]: unknown };
const docs = buildDocuments() as Doc[];

function walk(v: unknown, fn: (v: unknown) => void) {
  fn(v);
  if (Array.isArray(v)) v.forEach((x) => walk(x, fn));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => walk(x, fn));
}

describe("buildDocuments", () => {
  it("only builds studio* documents with fixed ids", () => {
    expect(docs.map((d) => d._id).sort()).toEqual(
      [
        "studioGame.exoplanet-explorer",
        "studioGame.mission-control",
        "studioGame.space-cowboy",
        "studioGame.strata",
        "studioGame.terraforge",
        "studioSettings",
      ].sort(),
    );
    for (const d of docs) expect(d._type).toMatch(/^studio/);
  });

  it("has no bracketed placeholder strings", () => {
    for (const d of docs) walk(d, (v) => { if (typeof v === "string") expect(v).not.toMatch(/\[.*\]/); });
  });

  it("gives every array object item a _key", () => {
    for (const d of docs)
      walk(d, (v) => {
        if (Array.isArray(v)) for (const item of v) if (item && typeof item === "object") expect(item).toHaveProperty("_key");
      });
  });
});
