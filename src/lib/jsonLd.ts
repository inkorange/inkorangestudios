import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";
import type { Game, Post, SiteSettings } from "@/lib/sanity/types";

export type JsonLdObject = Record<string, unknown>;

const LOGO_PATH = "/brand/inkorange-logo.png";

function trim(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, "");
}

function organizationRef(base: string): JsonLdObject {
  return { "@type": "Organization", "@id": `${base}/#organization`, name: SITE_NAME, url: `${base}/` };
}

/** Home page graph: the studio as an Organization, and the WebSite it publishes. */
export function siteJsonLd(siteUrl: string, settings: Pick<SiteSettings, "socialLinks" | "supportEmail">): JsonLdObject {
  const base = trim(siteUrl);
  const sameAs = settings.socialLinks.map((link) => link.url).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...organizationRef(base),
        description: SITE_DESCRIPTION,
        logo: { "@type": "ImageObject", url: `${base}${LOGO_PATH}` },
        ...(sameAs.length > 0 ? { sameAs } : {}),
        ...(settings.supportEmail
          ? { contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: settings.supportEmail } }
          : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        name: SITE_NAME,
        url: `${base}/`,
        inLanguage: "en",
        publisher: { "@id": `${base}/#organization` },
      },
    ],
  };
}

/** schema.org `VideoGame` for a game page. Empty fields are left out. */
export function videoGameJsonLd(game: Game, siteUrl: string): JsonLdObject {
  const base = trim(siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.name,
    ...(game.blurb ? { description: game.blurb } : {}),
    ...(game.genres.length > 0 ? { genre: game.genres } : {}),
    ...(game.platforms.length > 0 ? { gamePlatform: game.platforms } : {}),
    publisher: organizationRef(base),
    url: `${base}/games/${game.slug}`,
    ...(game.keyArt ? { image: game.keyArt.src } : {}),
  };
}

/** schema.org `BlogPosting` for a news post, published by the studio. */
export function blogPostingJsonLd(post: Pick<Post, "slug" | "title" | "date" | "excerpt" | "image">, siteUrl: string): JsonLdObject {
  const base = trim(siteUrl);
  const url = `${base}/news/${post.slug}`;
  const studio = { ...organizationRef(base), logo: { "@type": "ImageObject", url: `${base}${LOGO_PATH}` } };
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.date,
    ...(post.excerpt ? { description: post.excerpt } : {}),
    ...(post.image ? { image: post.image.src } : {}),
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: studio,
    publisher: studio,
  };
}

/** JSON for an inline `<script>`: `<` becomes `<`, so CMS text can never close the tag. */
export function serializeJsonLd(data: JsonLdObject): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
