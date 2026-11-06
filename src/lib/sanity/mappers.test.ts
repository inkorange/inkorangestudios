import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  publicEnv: { sanityProjectId: "abc123", sanityDataset: "production" },
  readServerEnv: () => ({}),
}));

import { mapFaq, mapGame, mapGameSummary, mapLegalPage, mapPost, mapPostSummary, mapSettings, toFeatured } from "./mappers";

const img = (alt = "Art") => ({ alt, asset: { _ref: "image-a1b2c3d4-2000x1000-jpg" }, dimensions: { width: 2000, height: 1000 } });

const base = { slug: "terraforge", name: "TerraForge", status: "coming-soon", blurb: "Build worlds." };

describe("mapGame", () => {
  it("returns null without a slug or name", () => {
    expect(mapGame({ ...base, slug: undefined })).toBeNull();
    expect(mapGame({ ...base, slug: "  " })).toBeNull();
    expect(mapGame({ ...base, name: "[NAME]" })).toBeNull();
    expect(mapGame(null)).toBeNull();
    expect(mapGame("nope")).toBeNull();
  });

  it("a sparse game has no placeholders, facts, media or notify", () => {
    const g = mapGame({
      ...base,
      priceLabel: "[PRICE]",
      facts: [{ label: "Release", value: "[RELEASE DATE]" }],
      features: [{ title: "[FEATURE]", body: "x" }],
      primaryCta: { label: "[CTA]", url: "https://x.test" },
      pressKitUrl: " ",
      notifyPlatform: { enabled: true, platform: "[PLATFORM]" },
    })!;
    expect(g.priceLabel).toBeNull();
    expect(g.facts).toEqual([]);
    expect(g.features).toEqual([]);
    expect(g.media).toEqual([]);
    expect(g.primaryCta).toBeNull();
    expect(g.pressKitUrl).toBeNull();
    expect(g.notify).toBeNull();
    expect(g.genres).toEqual([]);
    expect(g.keyArt).toBeNull();
  });

  it("builds media with the trailer first", () => {
    const g = mapGame({
      ...base,
      trailer: { url: "https://youtu.be/abc", poster: img("Poster"), duration: "1:42" },
      screenshots: [{ image: img("One"), caption: "First" }, { image: img("Two") }],
    })!;
    expect(g.media).toHaveLength(3);
    expect(g.media[0]).toMatchObject({ kind: "trailer", url: "https://youtu.be/abc", duration: "1:42" });
    expect(g.media[1]).toMatchObject({ kind: "image", label: "First" });
    expect(g.media[2]).toMatchObject({ kind: "image", label: "Screenshot 2" });
  });

  it("skips a trailer without a url and screenshots without usable images", () => {
    const g = mapGame({ ...base, trailer: { poster: img() }, screenshots: [{ caption: "x" }, { image: { alt: "" } }] })!;
    expect(g.media).toEqual([]);
  });

  it("trims, coerces wrong types and ignores unknown fields", () => {
    const g = mapGame({
      ...base,
      name: "  TerraForge ",
      status: "bogus",
      genres: ["Builder", 4, "[GENRE]", " "],
      platforms: "PC",
      featured: "yes",
      extra: { a: 1 },
      facts: [{ label: " Engine ", value: " Unity " }, { label: "Only label" }, 7],
      features: [{ title: "Terrain", body: " Shape it. " }, { title: "No body" }],
      notifyPlatform: { enabled: true, platform: " Steam " },
      primaryCta: { label: "Wishlist", url: "https://s.test" },
      coverArt: img("Cover"),
    })!;
    expect(g.name).toBe("TerraForge");
    expect(g.status).toBe("in-development");
    expect(g.genres).toEqual(["Builder"]);
    expect(g.platforms).toEqual([]);
    expect(g.featured).toBe(false);
    expect(g.facts).toEqual([{ label: "Engine", value: "Unity" }]);
    expect(g.features).toEqual([{ title: "Terrain", body: "Shape it." }, { title: "No body", body: "" }]);
    expect(g.notify).toEqual({ platform: "Steam" });
    expect(g.primaryCta).toEqual({ label: "Wishlist", href: "https://s.test" });
    expect(g.coverArt).toMatchObject({ alt: "Cover" });
  });

  it("keeps block items and valid images in description, mapped to ImageRef + caption", () => {
    const image = {
      _type: "image",
      _key: "img1",
      alt: " A ridge at dusk ",
      caption: " Early terrain ",
      asset: { _ref: "image-a1b2c3d4-2000x1000-jpg" },
      crop: { top: 0, bottom: 0, left: 0, right: 0.5 },
    };
    const g = mapGame({
      ...base,
      description: [{ _type: "block", children: [] }, image, { _type: "image", _key: "noalt", asset: { _ref: "image-a1b2c3d4-2000x1000-jpg" } }, { _type: "video" }, 3],
    })!;
    expect(g.description).toHaveLength(2);
    expect(g.description[1]).toMatchObject({
      _type: "image",
      _key: "img1",
      caption: "Early terrain",
      image: { alt: "A ridge at dusk", width: 1600, height: 1600 },
    });
    const mapped = g.description[1] as { image: { src: string } };
    expect(mapped.image.src).toContain("rect=0,0,1000,1000");
  });
});

describe("mapGameSummary and toFeatured", () => {
  const raw = { ...base, genres: ["Builder", "Sim"], platforms: ["PC", "Mac"], coverArt: img("Cover"), keyArt: img("Key") };
  it("summarises", () => {
    expect(mapGameSummary(raw)).toMatchObject({ slug: "terraforge", genre: "Builder", platformLabel: "PC · Mac", status: "coming-soon" });
    expect(mapGameSummary({ ...raw, slug: "" })).toBeNull();
  });
  it("maps featured", () => {
    const f = toFeatured(mapGame(raw)!);
    expect(f).toMatchObject({
      slug: "terraforge",
      genre: "BUILDER",
      platformLabel: "PC · MAC",
      detailHref: "/games/terraforge",
      cta: { label: "Game details", href: "/games/terraforge" },
    });
    expect(f.art).toMatchObject({ alt: "Key" });
  });
  it("uses primaryCta and falls back to cover art", () => {
    const f = toFeatured(mapGame({ ...raw, keyArt: null, primaryCta: { label: "Wishlist", url: "https://s.test" } })!);
    expect(f.cta).toEqual({ label: "Wishlist", href: "https://s.test" });
    expect(f.art).toMatchObject({ alt: "Cover" });
  });
});

describe("mapPost", () => {
  const raw = { slug: "hello", title: "Hello", date: "2026-11-01", kind: "devlog", game: { slug: "terraforge", name: "TerraForge" }, excerpt: "[EXCERPT]", body: [{ _type: "block" }] };
  it("maps", () => {
    const p = mapPost(raw)!;
    expect(p).toMatchObject({ slug: "hello", kind: "devlog", excerpt: null, game: { slug: "terraforge", name: "TerraForge" } });
    expect(p.body).toHaveLength(1);
  });
  it("defaults kind and nulls broken games; rejects missing slug/title/date", () => {
    expect(mapPost({ ...raw, kind: "zzz", game: { slug: "" } })).toMatchObject({ kind: "update", game: null });
    expect(mapPost({ ...raw, slug: undefined })).toBeNull();
    expect(mapPost({ ...raw, title: "" })).toBeNull();
    expect(mapPost({ ...raw, date: undefined })).toBeNull();
    expect(mapPostSummary(raw)).not.toHaveProperty("body");
  });
});

describe("mapLegalPage and mapFaq", () => {
  it("maps pages", () => {
    expect(mapLegalPage({ slug: "privacy", title: "Privacy", updatedAt: "2026-01-01", body: [] })).toMatchObject({ slug: "privacy", updatedAt: "2026-01-01" });
    expect(mapLegalPage({ title: "x" })).toBeNull();
  });
  it("maps faqs and drops ones without a question", () => {
    expect(mapFaq({ _id: "a", question: " Why? ", answer: [{ _type: "block" }] })).toMatchObject({ id: "a", question: "Why?" });
    expect(mapFaq({ _id: "a", question: "[Q]" })).toBeNull();
  });
});

describe("mapGame beta testing", () => {
  const game = (betaTesting: unknown) => mapGame({ slug: "s", name: "S", betaTesting })!.beta;
  it("is off for No, unset or an unknown value", () => {
    expect(game(undefined)).toBeNull();
    expect(game({ signup: "no", platforms: ["ios"] })).toBeNull();
    expect(game({ signup: "maybe" })).toBeNull();
  });
  it("Yes opens the signup with its platforms and copy", () => {
    expect(game({ signup: "yes", platforms: ["ios", "[P]", "android"], title: " Test it ", body: "[BODY]" })).toEqual({
      state: "open",
      platforms: ["ios", "android"],
      title: "Test it",
      body: null,
    });
    expect(game({ signup: "yes" })).toEqual({ state: "open", platforms: [], title: null, body: null });
  });
  it("Closed keeps only the copy", () => {
    expect(game({ signup: "closed", platforms: ["ios"], title: "Done" })).toEqual({ state: "closed", title: "Done", body: null });
  });
});

describe("mapSettings", () => {
  it("returns defaults for garbage", () => {
    const empty = { supportEmail: null, socialLinks: [], betaCallout: null, newsletterBlurb: null, studioPhoto: null, foundedLine: null };
    expect(mapSettings(null)).toEqual(empty);
    expect(mapSettings({ supportEmail: "[SUPPORT EMAIL]", socialLinks: [{ label: "X", url: "[URL]" }] })).toEqual(empty);
  });
  it("maps values", () => {
    const s = mapSettings({
      supportEmail: " hi@x.test ",
      socialLinks: [{ label: "Bluesky", url: "https://b.test" }, { label: "bad" }],
      betaCallout: { title: "Join beta", platforms: ["PC", "[P]"], game: { slug: "terraforge", name: "TerraForge" } },
      studioPhoto: img("Team"),
    });
    expect(s.supportEmail).toBe("hi@x.test");
    expect(s.socialLinks).toEqual([{ label: "Bluesky", url: "https://b.test" }]);
    expect(s.betaCallout).toMatchObject({ title: "Join beta", eyebrow: null, platforms: ["PC"], game: { slug: "terraforge" } });
    expect(s.studioPhoto).toMatchObject({ alt: "Team" });
  });
  it("drops the betaCallout once its game's testing has closed", () => {
    const game = (betaSignup?: string) => ({ slug: "terraforge", name: "TerraForge", betaSignup });
    expect(mapSettings({ betaCallout: { title: "Join beta", game: game("closed") } }).betaCallout).toBeNull();
    expect(mapSettings({ betaCallout: { title: "Join beta", game: game("no") } }).betaCallout).not.toBeNull();
    expect(mapSettings({ betaCallout: { title: "Join beta", game: game() } }).betaCallout).not.toBeNull();
  });
  it("drops an empty betaCallout", () => {
    expect(mapSettings({ betaCallout: { title: "[T]" } }).betaCallout).toBeNull();
  });
});
