// Pure: loads in the Studio browser bundle and on the server. No env, no server-only imports.
import createImageUrlBuilder from "@sanity/image-url";
import { PLATFORMS, statusLabel, toPlatform, type GameStatus } from "@/lib/games";
import type { EmailBlock, EmailButton, EmailChip, EmailImage, EmailSection, IssueData } from "./email/types";

const IMAGE_FIELDS = "asset, crop, hotspot, alt";

export const ISSUE_QUERY = /* groq */ `*[_type == "studioNewsletterIssue" && _id == $id][0]{
  _id,
  subject,
  preheader,
  issueLine,
  headline,
  intro,
  sections[]{
    _type,
    _type == "gameSection" => {
      body,
      buttonLabel,
      buttonUrl,
      "image": image{ ${IMAGE_FIELDS} },
      "game": game->{
        name,
        "slug": slug.current,
        status,
        platforms,
        primaryCta,
        "betaSignup": betaTesting.signup,
        "keyArt": keyArt{ ${IMAGE_FIELDS} },
        "coverArt": coverArt{ ${IMAGE_FIELDS} }
      }
    },
    _type == "freeSection" => {
      eyebrow,
      title,
      body,
      buttonLabel,
      buttonUrl,
      "image": image{ ${IMAGE_FIELDS} }
    }
  }
}`;

export const SETTINGS_QUERY = /* groq */ `*[_id == "studioSettings"][0].newsletter{ mailingAddress, fromName }`;

export type ImageConfig = { projectId: string; dataset: string };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

const REF_PATTERN = /^image-[A-Za-z0-9]+-\d+x\d+-([a-z0-9]+)$/;

function assetRef(source: unknown): string | null {
  if (!isObj(source) || !isObj(source.asset)) return null;
  return str(source.asset._ref) ?? str(source.asset._id);
}

/**
 * An image scaled for email: JPEG (icons stay PNG when the original is a PNG), q=75, never `auto=format`
 * (which can return WebP). Cards are a 2:1 crop honouring the Studio hotspot and crop. Null without an asset.
 */
export function emailImageUrl(
  source: unknown,
  cfg: ImageConfig,
  kind: "card" | "icon",
  altFallback = "",
): EmailImage | null {
  const ref = assetRef(source);
  if (!ref || !isObj(source)) return null;
  // Card art is photographic and large: always JPEG. Icons may need transparency, so PNG stays PNG.
  const keepPng = kind === "icon" && REF_PATTERN.exec(ref)?.[1] === "png";
  const [width, height] = kind === "card" ? [1200, 600] : [128, 128];
  const builderSource = {
    asset: { _ref: ref },
    ...(isObj(source.crop) ? { crop: source.crop } : {}),
    ...(isObj(source.hotspot) ? { hotspot: source.hotspot } : {}),
  };
  const src = createImageUrlBuilder(cfg)
    .image(builderSource as never)
    .width(width)
    .height(height)
    .fit("crop")
    .format(keepPng ? "png" : "jpg")
    .quality(75)
    .url();
  return { src, alt: str(source.alt) ?? altFallback, width, height };
}

function absolute(url: unknown, siteUrl: string): string | null {
  const u = str(url);
  if (!u) return null;
  if (/^(https?:\/\/|mailto:)/i.test(u)) return u;
  if (u.startsWith("/") && !u.startsWith("//")) return siteUrl.replace(/\/+$/, "") + u;
  return null;
}

const blocks = (v: unknown): EmailBlock[] =>
  Array.isArray(v) ? (v.filter((b) => isObj(b) && b._type === "block") as EmailBlock[]) : [];

function overrideButton(sec: Obj, siteUrl: string, tone: EmailButton["tone"]): EmailButton | null {
  const label = str(sec.buttonLabel);
  const href = absolute(sec.buttonUrl, siteUrl);
  return label && href ? { label, href, tone } : null;
}

const STATUSES = ["out-now", "coming-soon", "in-development", "announcing-soon"];

function gameSection(sec: Obj, opts: { siteUrl: string; images: ImageConfig }): EmailSection | null {
  const g = sec.game;
  if (!isObj(g)) return null;
  const name = str(g.name);
  const slug = str(g.slug);
  if (!name || !slug) return null;
  const { siteUrl, images } = opts;
  const base = siteUrl.replace(/\/+$/, "");
  const betaOpen = g.betaSignup === "yes";

  const chips: EmailChip[] = [];
  if (typeof g.status === "string" && STATUSES.includes(g.status)) {
    chips.push({
      label: statusLabel(g.status as GameStatus),
      tone: g.status === "out-now" || betaOpen ? "accent" : "outline",
    });
  }
  const known = new Set((Array.isArray(g.platforms) ? g.platforms : []).map(toPlatform));
  for (const label of PLATFORMS) {
    if (known.has(label)) chips.push({ label, tone: "outline" });
  }

  let button = overrideButton(sec, siteUrl, "accent");
  if (!button && betaOpen) {
    button = { label: "Join the beta", href: `${base}/games/${slug}#beta`, tone: "accent" };
  }
  if (!button && isObj(g.primaryCta)) {
    const label = str(g.primaryCta.label);
    const href = absolute(g.primaryCta.url, siteUrl);
    if (label && href) button = { label, href, tone: "outline" };
  }
  button ??= { label: "Game details", href: `${base}/games/${slug}`, tone: "outline" };

  const image =
    [sec.image, g.keyArt, g.coverArt]
      .map((s) => emailImageUrl(s, images, "card", name))
      .find((i) => i !== null) ?? null;

  return { kind: "game", title: name, image, chips, body: blocks(sec.body), button };
}

function freeSection(sec: Obj, opts: { siteUrl: string; images: ImageConfig }): EmailSection | null {
  const title = str(sec.title);
  if (!title) return null;
  return {
    kind: "free",
    eyebrow: str(sec.eyebrow),
    title,
    image: emailImageUrl(sec.image, opts.images, "card", title),
    body: blocks(sec.body),
    button: overrideButton(sec, opts.siteUrl, "accent"),
  };
}

/** The query result as renderer input. Null when the issue has no id, no subject or nothing renderable. */
export function resolveIssue(raw: unknown, opts: { siteUrl: string; images: ImageConfig }): IssueData | null {
  if (!isObj(raw)) return null;
  const id = str(raw._id);
  const subject = str(raw.subject);
  if (!id || !subject) return null;
  const sections = (Array.isArray(raw.sections) ? raw.sections : []).flatMap((s): EmailSection[] => {
    if (!isObj(s)) return [];
    const r = s._type === "gameSection" ? gameSection(s, opts) : s._type === "freeSection" ? freeSection(s, opts) : null;
    return r ? [r] : [];
  });
  if (!sections.length) return null;
  return {
    id,
    subject,
    preheader: str(raw.preheader),
    issueLine: str(raw.issueLine),
    headline: str(raw.headline),
    intro: blocks(raw.intro),
    sections,
  };
}
