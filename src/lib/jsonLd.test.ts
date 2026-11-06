import { describe, expect, it } from "vitest";
import type { Game } from "@/lib/sanity/types";
import { blogPostingJsonLd, serializeJsonLd, siteJsonLd, videoGameJsonLd } from "./jsonLd";

const game: Game = {
  slug: "terraforge",
  name: "TerraForge",
  status: "out-now",
  genres: ["Sandbox", "Creative"],
  platforms: ["Web"],
  stores: [],
  blurb: "Build planets.",
  description: [],
  appIcon: null,
  keyArt: { src: "https://cdn.sanity.io/images/p/d/key.jpg", alt: "Key art", width: 2000, height: 1000 },
  coverArt: null,
  media: [],
  features: [],
  facts: [],
  priceLabel: null,
  primaryCta: null,
  notify: null,
  beta: null,
  pressKitUrl: null,
  featured: false,
};

describe("videoGameJsonLd", () => {
  it("describes the game as a schema.org VideoGame published by the studio", () => {
    expect(videoGameJsonLd(game, "https://inkorangestudios.com/")).toEqual({
      "@context": "https://schema.org",
      "@type": "VideoGame",
      name: "TerraForge",
      description: "Build planets.",
      genre: ["Sandbox", "Creative"],
      gamePlatform: ["Web"],
      publisher: {
        "@type": "Organization",
        "@id": "https://inkorangestudios.com/#organization",
        name: "inkOrange Studios",
        url: "https://inkorangestudios.com/",
      },
      url: "https://inkorangestudios.com/games/terraforge",
      image: "https://cdn.sanity.io/images/p/d/key.jpg",
    });
  });

  it("omits empty fields", () => {
    const ld = videoGameJsonLd({ ...game, blurb: "", genres: [], platforms: [], keyArt: null }, "https://inkorangestudios.com");
    expect(ld).not.toHaveProperty("description");
    expect(ld).not.toHaveProperty("genre");
    expect(ld).not.toHaveProperty("gamePlatform");
    expect(ld).not.toHaveProperty("image");
    expect(ld.url).toBe("https://inkorangestudios.com/games/terraforge");
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so CMS text can't close the script tag", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});

describe("siteJsonLd", () => {
  it("describes the studio and the website, linking socials and support", () => {
    const ld = siteJsonLd("https://www.inkorangestudios.com/", {
      socialLinks: [{ label: "Bluesky", url: "https://bsky.app/profile/inkorange" }],
      supportEmail: "help@example.com",
    });
    const [org, site] = ld["@graph"] as Record<string, unknown>[];
    expect(org).toMatchObject({
      "@type": "Organization",
      "@id": "https://www.inkorangestudios.com/#organization",
      name: "inkOrange Studios",
      url: "https://www.inkorangestudios.com/",
      logo: { url: "https://www.inkorangestudios.com/brand/inkorange-logo.png" },
      sameAs: ["https://bsky.app/profile/inkorange"],
      contactPoint: { email: "help@example.com" },
    });
    expect(site).toMatchObject({ "@type": "WebSite", url: "https://www.inkorangestudios.com/", publisher: { "@id": org["@id"] } });
  });

  it("leaves out socials and contact when settings have none", () => {
    const [org] = siteJsonLd("https://www.inkorangestudios.com", { socialLinks: [], supportEmail: null })["@graph"] as Record<string, unknown>[];
    expect(org).not.toHaveProperty("sameAs");
    expect(org).not.toHaveProperty("contactPoint");
  });
});

describe("blogPostingJsonLd", () => {
  const post = { slug: "devlog-1", title: "Devlog 1", date: "2026-11-01", excerpt: "First steps.", image: { src: "https://cdn/x.jpg", alt: "", width: 1, height: 1 } };

  it("describes the post as a BlogPosting by the studio", () => {
    expect(blogPostingJsonLd(post, "https://www.inkorangestudios.com")).toMatchObject({
      "@type": "BlogPosting",
      headline: "Devlog 1",
      datePublished: "2026-11-01",
      description: "First steps.",
      image: "https://cdn/x.jpg",
      url: "https://www.inkorangestudios.com/news/devlog-1",
      mainEntityOfPage: { "@id": "https://www.inkorangestudios.com/news/devlog-1" },
      author: { name: "inkOrange Studios" },
      publisher: { name: "inkOrange Studios", logo: { url: "https://www.inkorangestudios.com/brand/inkorange-logo.png" } },
    });
  });

  it("omits a missing excerpt and image", () => {
    const ld = blogPostingJsonLd({ ...post, excerpt: null, image: null }, "https://www.inkorangestudios.com");
    expect(ld).not.toHaveProperty("description");
    expect(ld).not.toHaveProperty("image");
  });
});
