import { describe, expect, it } from "vitest";
import { ISSUE_QUERY, SETTINGS_QUERY, emailImageUrl, resolveIssue } from "./issue";

const opts = { siteUrl: "https://inkorange.studio", images: { projectId: "proj", dataset: "prod" } };
const webp = "image-abc123-1672x941-webp";
const png = "image-def456-800x800-png";
const img = (ref: string, alt = "Art") => ({ asset: { _type: "reference", _ref: ref }, alt });
const para = (text: string) => ({ _type: "block", children: [{ _type: "span", text }] });

const game = (over: Record<string, unknown> = {}) => ({
  name: "Space Cowboy",
  slug: "space-cowboy",
  status: "coming-soon",
  platforms: ["Android", "iOS"],
  primaryCta: null,
  betaSignup: "no",
  keyArt: null,
  coverArt: null,
  ...over,
});
const gameSection = (over: Record<string, unknown> = {}, g: unknown = game()) => ({
  _type: "gameSection",
  game: g,
  body: [para("Hi")],
  ...over,
});
const issue = (sections: unknown[], over: Record<string, unknown> = {}) => ({
  _id: "i1",
  subject: "Hello",
  preheader: "pre",
  issueLine: "No. 1",
  headline: "Head",
  intro: [para("Intro")],
  sections,
  ...over,
});
const one = (sec: unknown) => resolveIssue(issue([sec]), opts)!.sections[0];

describe("queries", () => {
  it("fetch the issue by $id and the settings singleton", () => {
    expect(ISSUE_QUERY).toContain("$id");
    expect(ISSUE_QUERY).toContain("game->");
    expect(SETTINGS_QUERY).toContain('"studioSettings"');
    expect(SETTINGS_QUERY).toContain("mailingAddress");
  });
});

describe("resolveIssue", () => {
  it("maps top-level fields", () => {
    const r = resolveIssue(issue([gameSection()]), opts)!;
    expect(r).toMatchObject({ id: "i1", subject: "Hello", preheader: "pre", issueLine: "No. 1", headline: "Head" });
    expect(r.intro).toHaveLength(1);
  });

  it("returns null without id, subject or renderable sections", () => {
    expect(resolveIssue(null, opts)).toBeNull();
    expect(resolveIssue(issue([gameSection()], { _id: undefined }), opts)).toBeNull();
    expect(resolveIssue(issue([gameSection()], { subject: " " }), opts)).toBeNull();
    expect(resolveIssue(issue([]), opts)).toBeNull();
    expect(resolveIssue(issue([gameSection({}, null)]), opts)).toBeNull();
  });

  it("drops a game section whose game is null but keeps the others", () => {
    const r = resolveIssue(issue([gameSection({}, null), gameSection()]), opts)!;
    expect(r.sections).toHaveLength(1);
  });

  describe("buttons", () => {
    it("uses the section override first, absolute on siteUrl", () => {
      const s = one(gameSection({ buttonLabel: "Go", buttonUrl: "/x" }, game({ betaSignup: "yes" })));
      expect(s).toMatchObject({ button: { label: "Go", href: "https://inkorange.studio/x" } });
    });
    it("keeps absolute override urls", () => {
      const s = one(gameSection({ buttonLabel: "Go", buttonUrl: "https://a.example/p" }));
      expect((s as { button: { href: string } }).button.href).toBe("https://a.example/p");
    });
    it("needs both override label and url", () => {
      const s = one(gameSection({ buttonLabel: "Go" }));
      expect((s as { button: { label: string } }).button.label).toBe("Game details");
    });
    it("open beta gives Join the beta, accent", () => {
      expect(one(gameSection({}, game({ betaSignup: "yes", primaryCta: { label: "P", url: "/p" } })))).toMatchObject({
        button: { label: "Join the beta", href: "https://inkorange.studio/games/space-cowboy#beta", tone: "accent" },
      });
    });
    it("primary CTA otherwise, outline, made absolute", () => {
      expect(one(gameSection({}, game({ primaryCta: { label: "Play", url: "/play" } })))).toMatchObject({
        button: { label: "Play", href: "https://inkorange.studio/play", tone: "outline" },
      });
    });
    it("falls back to Game details", () => {
      expect(one(gameSection())).toMatchObject({
        button: { label: "Game details", href: "https://inkorange.studio/games/space-cowboy", tone: "outline" },
      });
    });
    it("ignores a closed beta", () => {
      expect(one(gameSection({}, game({ betaSignup: "closed" })))).toMatchObject({ button: { label: "Game details" } });
    });
  });

  describe("chips", () => {
    it("status chip first then platforms, outline for coming soon", () => {
      expect(one(gameSection())).toMatchObject({
        chips: [
          { label: "COMING SOON", tone: "outline" },
          { label: "Android", tone: "outline" },
          { label: "iOS", tone: "outline" },
        ],
      });
    });
    it("keeps only known platforms, deduped, in canonical order", () => {
      const s = one(gameSection({}, game({ platforms: ["iOS", "Android", "ios", "Switch"] }))) as {
        chips: { label: string }[];
      };
      expect(s.chips.map((c) => c.label)).toEqual(["COMING SOON", "Android", "iOS"]);
    });
    it("status chip is accent for out-now", () => {
      expect(one(gameSection({}, game({ status: "out-now" })))).toMatchObject({
        chips: [{ label: "OUT NOW", tone: "accent" }, expect.anything(), expect.anything()],
      });
    });
    it("status chip is accent for an open beta", () => {
      const s = one(gameSection({}, game({ betaSignup: "yes" }))) as { chips: { tone: string }[] };
      expect(s.chips[0].tone).toBe("accent");
    });
  });

  describe("art", () => {
    it("prefers the section image, then key art, then cover art, then null", () => {
      const g = game({ keyArt: img("image-k1-100x100-jpg"), coverArt: img("image-c1-100x100-jpg") });
      const src = (sec: unknown) => (one(sec) as { image: { src: string } | null }).image?.src ?? null;
      expect(src(gameSection({ image: img("image-s1-100x100-jpg") }, g))).toContain("s1-100x100.jpg");
      expect(src(gameSection({}, g))).toContain("k1-100x100.jpg");
      expect(src(gameSection({}, game({ coverArt: img("image-c1-100x100-jpg") })))).toContain("c1-100x100.jpg");
      expect(src(gameSection())).toBeNull();
    });
    it("uses the game name as alt fallback", () => {
      const s = one(gameSection({}, game({ keyArt: { asset: { _ref: png } } }))) as { image: { alt: string } };
      expect(s.image.alt).toBe("Space Cowboy");
    });
  });

  describe("free sections", () => {
    it("maps with no image or button", () => {
      expect(one({ _type: "freeSection", title: "Also", body: [para("x")] })).toEqual({
        kind: "free",
        eyebrow: null,
        title: "Also",
        image: null,
        body: [para("x")],
        button: null,
      });
    });
    it("maps eyebrow, image and button", () => {
      const s = one({
        _type: "freeSection",
        eyebrow: "New",
        title: "T",
        body: [],
        image: img(png, "Alt"),
        buttonLabel: "Read",
        buttonUrl: "/news",
      });
      expect(s).toMatchObject({
        kind: "free",
        eyebrow: "New",
        image: { alt: "Alt" },
        button: { label: "Read", href: "https://inkorange.studio/news", tone: "accent" },
      });
    });
    it("drops sections without a title and unknown types", () => {
      expect(resolveIssue(issue([{ _type: "freeSection", body: [] }, { _type: "other" }]), opts)).toBeNull();
    });
  });
});

describe("emailImageUrl", () => {
  const cfg = opts.images;
  it("re-encodes WebP as jpg at 1200 wide, never auto=format", () => {
    const r = emailImageUrl(img(webp), cfg, "card")!;
    const u = new URL(r.src);
    expect(u.searchParams.get("fm")).toBe("jpg");
    expect(u.searchParams.get("w")).toBe("1200");
    expect(u.searchParams.get("h")).toBe("600");
    expect(u.searchParams.get("fit")).toBe("crop");
    expect(u.searchParams.get("q")).toBe("75");
    expect(r.src).not.toContain("auto=format");
    expect(r).toMatchObject({ width: 1200, height: 600, alt: "Art" });
  });
  it("keeps PNG as png", () => {
    expect(new URL(emailImageUrl(img(png), cfg, "card")!.src).searchParams.get("fm")).toBe("png");
  });
  it("icons are 128x128", () => {
    const r = emailImageUrl(img(png), cfg, "icon")!;
    expect(new URL(r.src).searchParams.get("w")).toBe("128");
    expect(r).toMatchObject({ width: 128, height: 128 });
  });
  it("honours the hotspot and crop", () => {
    const r = emailImageUrl(
      { ...img(webp), hotspot: { x: 0.5, y: 0.5, width: 0.4, height: 0.4 }, crop: { top: 0, bottom: 0.1, left: 0, right: 0 } },
      cfg,
      "card",
    )!;
    expect(new URL(r.src).searchParams.get("rect")).not.toBeNull();
  });
  it("returns null without an asset", () => {
    expect(emailImageUrl(null, cfg, "card")).toBeNull();
    expect(emailImageUrl({ alt: "x" }, cfg, "card")).toBeNull();
  });
});
