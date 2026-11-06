import { describe, expect, it } from "vitest";
import { mapGame, mapGameSummary, mapSettings, toFeatured } from "@/lib/sanity/mappers";
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
        "studioGame-exoplanet-explorer",
        "studioGame-mission-control",
        "studioGame-space-cowboy",
        "studioGame-strata",
        "studioGame-terraforge",
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

describe("seed ids", () => {
  it("never uses dotted ids (dotted ids are private in Sanity)", () => {
    for (const d of docs) expect(d._id).not.toContain(".");
  });
});

describe("seed docs through the site mappers", () => {
  // Mirror the GROQ projection: slug -> slug.current, game ref -> { slug, name }.
  const project = (d: Doc) => ({ ...d, slug: (d.slug as { current: string } | undefined)?.current });
  const games = docs.filter((d) => d._type === "studioGame");
  const byId = new Map(games.map((g) => [g._id, g]));

  it("maps every game, summary and featured card", () => {
    for (const g of games) {
      expect(mapGame(project(g))).not.toBeNull();
      expect(mapGameSummary(project(g))).not.toBeNull();
    }
    const tf = mapGame(project(byId.get("studioGame-terraforge")!))!;
    expect(tf.status).toBe("out-now");
    expect(tf.primaryCta).toEqual({ label: "Play free in browser", href: "https://www.terraforgeworlds.com" });
    expect(tf.notify).toEqual({ platform: "Android" });
    expect(tf.features).toHaveLength(6);
    expect(tf.facts.map((f) => f.label)).toEqual(["Developer", "Genre", "Platforms", "Players"]);
    expect(toFeatured(tf).cta.label).toBe("Play free in browser");
    expect(mapGame(project(byId.get("studioGame-space-cowboy")!))!.status).toBe("coming-soon");
  });

  it("maps settings with the beta callout and resolved game", () => {
    const raw = docs.find((d) => d._id === "studioSettings")! as Doc & { betaCallout: { game: { _ref: string } } };
    const target = byId.get(raw.betaCallout.game._ref);
    expect(target).toBeDefined();
    const resolved = {
      ...raw,
      betaCallout: { ...raw.betaCallout, game: { slug: (target!.slug as { current: string }).current, name: target!.name } },
    };
    const s = mapSettings(resolved);
    expect(s.betaCallout).toMatchObject({ eyebrow: "NOW RECRUITING TESTERS", platforms: ["ios", "android"] });
    expect(s.betaCallout?.game).toEqual({ slug: "space-cowboy", name: "Space Cowboy" });
  });
});
