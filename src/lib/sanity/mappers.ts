import { z } from "zod";
import { PLATFORMS, toPlatform, type GameStatus, type Platform } from "@/lib/games";
import { toImageRef, type SanityImageInput } from "./image";
import type {
  Faq,
  Featured,
  Game,
  GameBeta,
  GameSummary,
  ImageRef,
  LegalPage,
  Media,
  PortableTextBlock,
  Post,
  PostKind,
  PostSummary,
  RichBody,
  SiteSettings,
  StoreLink,
} from "./types";

/*
 * Lenient parsing: unknown fields are ignored, wrong types become null/omitted,
 * and nothing here throws. Only a missing slug/name (title for posts and pages,
 * question for FAQs) makes a mapper return null.
 */

const STATUSES: GameStatus[] = ["out-now", "coming-soon", "in-development", "announcing-soon"];
const POST_KINDS: PostKind[] = ["update", "announcement", "devlog", "patch-notes"];
const PLACEHOLDER = /^\[.*\]$/;

/** Trimmed non-empty string that is not a bracket placeholder, else null. */
function clean(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" || PLACEHOLDER.test(t) ? null : t;
}

const str = z.unknown().transform(clean);
const bool = z.unknown().transform((v) => v === true);
const strList = z.unknown().transform((v) => (Array.isArray(v) ? v.map(clean).filter((s): s is string => s !== null) : []));
const list = z.unknown().transform((v): unknown[] => (Array.isArray(v) ? v : []));
const obj = z.unknown().transform((v): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null));
const BODY_IMAGE = 1600;

/** Portable text: text blocks pass through; inline images become `BodyImage` (dropped without asset or alt); anything else is dropped. */
const blocks = z.unknown().transform((v): RichBody =>
  Array.isArray(v)
    ? v.flatMap((b, i): RichBody => {
        if (!b || typeof b !== "object") return [];
        const item = b as { _type?: unknown; _key?: unknown; caption?: unknown };
        if (item._type === "block") return [b as PortableTextBlock];
        if (item._type !== "image") return [];
        const img = image(b, BODY_IMAGE);
        return img ? [{ _type: "image", _key: clean(item._key) ?? `image-${i}`, image: img, caption: clean(item.caption) }] : [];
      })
    : [],
);

function image(v: unknown, width: number): ImageRef {
  const o = obj.parse(v);
  if (!o) return null;
  try {
    return toImageRef(o as SanityImageInput, width);
  } catch {
    return null;
  }
}

function slugName(v: unknown): { slug: string; name: string } | null {
  const o = obj.parse(v);
  const slug = clean(o?.slug);
  const name = clean(o?.name);
  return slug && name ? { slug, name } : null;
}

/**
 * Parses each key of a record with its own lenient schema. A missing key is
 * parsed as `undefined` (zod 4 object schemas reject missing keys for transforms).
 */
function lenient<S extends Record<string, z.ZodType>>(shape: S) {
  return (raw: unknown): { [K in keyof S]: z.output<S[K]> } | null => {
    const o = obj.parse(raw);
    if (!o) return null;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(shape)) out[key] = shape[key].parse(o[key]);
    return out as { [K in keyof S]: z.output<S[K]> };
  };
}

const WIDE = 1600;
/** Covers the 96px title icon at 2x. */
const ICON = 256;
const COVER = 600;
const CARD = 800;

const gameShape = lenient({
  slug: str,
  name: str,
  status: z.unknown().transform((v): GameStatus => (STATUSES.includes(v as GameStatus) ? (v as GameStatus) : "in-development")),
  genres: strList,
  platforms: z.unknown().transform((v): Platform[] => {
    const known = new Set(Array.isArray(v) ? v.map(toPlatform) : []);
    return PLATFORMS.filter((p) => known.has(p));
  }),
  blurb: str,
  description: blocks,
  storeLinks: obj,
  appIcon: obj,
  keyArt: z.unknown(),
  coverArt: z.unknown(),
  trailer: obj,
  screenshots: list,
  features: list,
  facts: list,
  priceLabel: str,
  primaryCta: obj,
  notifyPlatform: obj,
  betaTesting: obj,
  pressKitUrl: str,
  featured: bool,
});

/** "yes" opens the signup, "closed" shows the closed notice; "no", unset or anything else shows nothing. */
function mapBeta(o: Record<string, unknown> | null): GameBeta | null {
  const copy = { title: clean(o?.title), body: clean(o?.body) };
  if (o?.signup === "yes") return { state: "open", platforms: strList.parse(o.platforms), ...copy };
  if (o?.signup === "closed") return { state: "closed", ...copy };
  return null;
}

/** `fallbackPoster` (the key art) stands in when the trailer has no poster of its own. */
function mapMedia(trailer: Record<string, unknown> | null, screenshots: unknown[], fallbackPoster: ImageRef = null): Media[] {
  const media: Media[] = [];
  const url = clean(trailer?.url);
  if (trailer && url) {
    const duration = clean(trailer.duration);
    media.push({ kind: "trailer", label: "Trailer", poster: image(trailer.poster, WIDE) ?? fallbackPoster, url, ...(duration ? { duration } : {}) });
  }
  screenshots.forEach((s, i) => {
    const o = obj.parse(s);
    const img = image(o?.image, WIDE);
    if (img) media.push({ kind: "image", label: clean(o?.caption) ?? `Screenshot ${i + 1}`, image: img });
  });
  return media;
}

const STORE_FIELDS: Record<Platform, string> = { Android: "googlePlay", iOS: "appStore", Web: "web" };

/** A store link shows only for a ticked platform, and only when it is an https URL. */
function mapStores(platforms: Platform[], links: Record<string, unknown> | null): StoreLink[] {
  return platforms.flatMap((platform) => {
    const href = clean(links?.[STORE_FIELDS[platform]]);
    return href && /^https:\/\//i.test(href) ? [{ platform, href }] : [];
  });
}

export function mapGame(raw: unknown): Game | null {
  const d = gameShape(raw);
  if (!d || !d.slug || !d.name) return null;

  const cta = d.primaryCta;
  const ctaLabel = clean(cta?.label);
  const ctaHref = clean(cta?.url);
  const notifyPlatform = clean(d.notifyPlatform?.platform);
  const keyArt = image(d.keyArt, WIDE);

  return {
    slug: d.slug,
    name: d.name,
    status: d.status,
    genres: d.genres,
    platforms: d.platforms,
    stores: mapStores(d.platforms, d.storeLinks),
    blurb: d.blurb ?? "",
    description: d.description,
    appIcon: d.appIcon ? image({ ...d.appIcon, alt: clean(d.appIcon.alt) ?? `${d.name} app icon` }, ICON) : null,
    keyArt,
    coverArt: image(d.coverArt, COVER),
    media: mapMedia(d.trailer, d.screenshots, keyArt),
    features: d.features.flatMap((f) => {
      const o = obj.parse(f);
      const title = clean(o?.title);
      return title ? [{ title, body: clean(o?.body) ?? "" }] : [];
    }),
    facts: d.facts.flatMap((f) => {
      const o = obj.parse(f);
      const label = clean(o?.label);
      const value = clean(o?.value);
      return label && value ? [{ label, value }] : [];
    }),
    priceLabel: d.priceLabel,
    primaryCta: ctaLabel && ctaHref ? { label: ctaLabel, href: ctaHref } : null,
    notify: d.notifyPlatform?.enabled === true && notifyPlatform ? { platform: notifyPlatform } : null,
    beta: mapBeta(d.betaTesting),
    pressKitUrl: d.pressKitUrl,
    featured: d.featured,
  };
}

export function mapGameSummary(raw: unknown): GameSummary | null {
  const g = mapGame(raw);
  if (!g) return null;
  return {
    slug: g.slug,
    name: g.name,
    status: g.status,
    genre: g.genres[0] ?? "",
    platformLabel: g.platforms.join(" · "),
    cover: g.coverArt,
    stores: g.stores,
  };
}

export function toFeatured(game: Game): Featured {
  const detailHref = `/games/${game.slug}`;
  return {
    slug: game.slug,
    name: game.name,
    status: game.status,
    genre: (game.genres[0] ?? "").toUpperCase(),
    platformLabel: game.platforms.join(" · ").toUpperCase(),
    blurb: game.blurb,
    art: game.keyArt ?? game.coverArt,
    icon: game.appIcon,
    cta: game.primaryCta ?? { label: "Game details", href: detailHref },
    detailHref,
  };
}

const postShape = lenient({
  slug: str,
  title: str,
  date: str,
  kind: z.unknown().transform((v): PostKind => (POST_KINDS.includes(v as PostKind) ? (v as PostKind) : "update")),
  game: z.unknown(),
  coverImage: z.unknown(),
  excerpt: str,
  body: blocks,
});

export function mapPost(raw: unknown): Post | null {
  const d = postShape(raw);
  if (!d || !d.slug || !d.title || !d.date) return null;
  return {
    slug: d.slug,
    title: d.title,
    date: d.date,
    kind: d.kind,
    excerpt: d.excerpt,
    image: image(d.coverImage, CARD),
    game: slugName(d.game),
    body: d.body,
  };
}

export function mapPostSummary(raw: unknown): PostSummary | null {
  const p = mapPost(raw);
  if (!p) return null;
  return { slug: p.slug, title: p.title, date: p.date, kind: p.kind, excerpt: p.excerpt, image: p.image, game: p.game };
}

const pageShape = lenient({ slug: str, title: str, updatedAt: str, body: blocks });

export function mapLegalPage(raw: unknown): LegalPage | null {
  const d = pageShape(raw);
  if (!d || !d.slug || !d.title) return null;
  return { slug: d.slug, title: d.title, updatedAt: d.updatedAt, body: d.body };
}

const faqShape = lenient({ _id: str, question: str, answer: blocks, game: z.unknown() });

export function mapFaq(raw: unknown): Faq | null {
  const d = faqShape(raw);
  if (!d || !d.question) return null;
  return { id: d._id ?? d.question, question: d.question, answer: d.answer, game: slugName(d.game) };
}

const settingsShape = lenient({
  supportEmail: str,
  socialLinks: list,
  betaCallout: obj,
  newsletterBlurb: str,
  studioPhoto: z.unknown(),
  foundedLine: str,
});

export function mapSettings(raw: unknown): SiteSettings {
  const d = settingsShape(raw) ?? settingsShape({})!;

  const callout = d.betaCallout;
  const eyebrow = clean(callout?.eyebrow);
  const title = clean(callout?.title);
  const body = clean(callout?.body);
  const platforms = strList.parse(callout?.platforms);
  // A game whose testing has closed no longer recruits from the home page either.
  const closed = obj.parse(callout?.game)?.betaSignup === "closed";
  const betaCallout = callout && !closed && (eyebrow || title || body) ? { eyebrow, title, body, game: slugName(callout.game), platforms } : null;

  return {
    supportEmail: d.supportEmail,
    socialLinks: d.socialLinks.flatMap((l) => {
      const o = obj.parse(l);
      const label = clean(o?.label);
      const url = clean(o?.url);
      return label && url ? [{ label, url }] : [];
    }),
    betaCallout,
    newsletterBlurb: d.newsletterBlurb,
    studioPhoto: image(d.studioPhoto, CARD),
    foundedLine: d.foundedLine,
  };
}
