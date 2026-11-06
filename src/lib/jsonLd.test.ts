import { describe, expect, it } from "vitest";
import type { Game } from "@/lib/sanity/types";
import { serializeJsonLd, videoGameJsonLd } from "./jsonLd";

const game: Game = {
  slug: "terraforge",
  name: "TerraForge",
  status: "out-now",
  genres: ["Sandbox", "Creative"],
  platforms: ["Web"],
  blurb: "Build planets.",
  description: [],
  keyArt: { src: "https://cdn.sanity.io/images/p/d/key.jpg", alt: "Key art", width: 2000, height: 1000 },
  coverArt: null,
  media: [],
  features: [],
  facts: [],
  priceLabel: null,
  primaryCta: null,
  notify: null,
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
      publisher: { "@type": "Organization", name: "inkOrange Studios" },
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
