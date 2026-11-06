import type { Game } from "@/lib/sanity/types";

export type JsonLdObject = Record<string, unknown>;

/** schema.org `VideoGame` for a game page. Empty fields are left out. */
export function videoGameJsonLd(game: Game, siteUrl: string): JsonLdObject {
  const base = siteUrl.replace(/\/+$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.name,
    ...(game.blurb ? { description: game.blurb } : {}),
    ...(game.genres.length > 0 ? { genre: game.genres } : {}),
    ...(game.platforms.length > 0 ? { gamePlatform: game.platforms } : {}),
    publisher: { "@type": "Organization", name: "inkOrange Studios" },
    url: `${base}/games/${game.slug}`,
    ...(game.keyArt ? { image: game.keyArt.src } : {}),
  };
}

/** JSON for an inline `<script>`: `<` becomes `<`, so CMS text can never close the tag. */
export function serializeJsonLd(data: JsonLdObject): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
