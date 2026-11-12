/**
 * GROQ queries. Image fields project dimensions so toImageRef can size them, and the Studio crop
 * and hotspot so the image URL honours them. Portable text bodies come back raw: their inline
 * images carry asset._ref (which encodes the dimensions), alt, caption, crop and hotspot.
 */

const img = (field: string) =>
  `"${field}": ${field}{ "asset": asset{ _ref }, "dimensions": asset->metadata.dimensions{ width, height }, alt, crop, hotspot }`;

const GAME_FIELDS = `
  "slug": slug.current,
  name,
  status,
  genres,
  platforms,
  "storeLinks": storeLinks{ googlePlay, appStore, web },
  blurb,
  description,
  ${img("appIcon")},
  ${img("keyArt")},
  ${img("coverArt")},
  "trailer": trailer{ url, duration, ${img("poster")} },
  "screenshots": screenshots[]{ caption, ${img("image")} },
  features[]{ title, body },
  facts[]{ label, value },
  priceLabel,
  "primaryCta": primaryCta{ label, url },
  "notifyPlatform": notifyPlatform{ enabled, platform },
  "betaTesting": betaTesting{ signup, platforms, title, body, perk, whyTitle, whyBody, reasons[]{ title, body } },
  pressKitUrl,
  featured`;

const GAME_ORDER = `order(coalesce(sortOrder, 9999) asc, name asc)`;

export const GAMES_QUERY = `*[_type == "studioGame" && defined(slug.current)] | ${GAME_ORDER}{${GAME_FIELDS}}`;

export const FEATURED_QUERY = `*[_type == "studioGame" && featured == true && defined(slug.current)] | order(coalesce(featuredOrder, 9999) asc, name asc){${GAME_FIELDS}}`;

export const GAME_QUERY = `*[_type == "studioGame" && slug.current == $slug][0]{${GAME_FIELDS}}`;

export const GAME_SLUGS_QUERY = `*[_type == "studioGame" && defined(slug.current)].slug.current`;

const POST_SUMMARY_FIELDS = `
  _id,
  "format": coalesce(format, "article"),
  "slug": slug.current,
  url,
  source,
  title,
  date,
  kind,
  excerpt,
  ${img("coverImage")},
  "game": game->{ "slug": slug.current, name }`;

const IS_LINK = `(format == "link")`;

/** `limit` must be a positive integer; it is inlined because GROQ slices cannot take null. */
export function postsQuery(opts: { limit?: number; filterByGame: boolean }): string {
  const filter = opts.filterByGame ? ` && game->slug.current == $gameSlug` : "";
  const limit = opts.limit !== undefined && Number.isFinite(opts.limit) && Math.floor(opts.limit) >= 1
      ? `[0...${Math.floor(opts.limit)}]`
      : "";
  return `*[_type == "studioPost" && (${IS_LINK} && defined(url) || !${IS_LINK} && defined(slug.current))${filter}] | order(date desc)${limit}{${POST_SUMMARY_FIELDS}}`;
}

/** Only articles have a page here; a link post lives on the other site. */
export const POST_QUERY = `*[_type == "studioPost" && !${IS_LINK} && slug.current == $slug][0]{${POST_SUMMARY_FIELDS}, body}`;

export const LEGAL_PAGE_QUERY = `*[_type == "studioPage" && slug.current == $slug][0]{ "slug": slug.current, title, updatedAt, body }`;

export const FAQS_QUERY = `*[_type == "studioFaq"] | order(order asc, _createdAt asc){ _id, question, answer, "game": game->{ "slug": slug.current, name } }`;

export const SETTINGS_QUERY = `*[_type == "studioSettings"][0]{
  supportEmail,
  socialLinks[]{ label, url },
  "betaCallout": betaCallout{ eyebrow, title, body, platforms, "game": game->{ "slug": slug.current, name, "betaSignup": betaTesting.signup } },
  newsletterBlurb,
  ${img("studioPhoto")},
  foundedLine
}`;

export const TOOLS_QUERY = `*[_type == "studioTool"] | order(coalesce(sortOrder, 9999) asc, name asc){
  name,
  status,
  url,
  summary,
  ${img("banner")},
  links[]{ label, url }
}`;
