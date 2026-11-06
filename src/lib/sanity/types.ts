import type { PortableTextBlock } from "@portabletext/react";
import type { GameStatus } from "@/lib/games";

export type { PortableTextBlock };

export type ImageRef = { src: string; alt: string; width: number; height: number } | null;

/** An image placed inside a portable text body in the Studio, mapped for rendering. */
export type BodyImage = { _type: "image"; _key: string; image: NonNullable<ImageRef>; caption: string | null };

/** A mapped portable text body: text blocks plus inline images. */
export type RichBody = (PortableTextBlock | BodyImage)[];

export type PostKind = "update" | "announcement" | "devlog" | "patch-notes";

const POST_KIND_LABELS: Record<PostKind, string> = {
  update: "UPDATE",
  announcement: "ANNOUNCEMENT",
  devlog: "DEVLOG",
  "patch-notes": "PATCH NOTES",
};

export function postKindLabel(kind: PostKind): string {
  return POST_KIND_LABELS[kind];
}

export type Media =
  | { kind: "trailer"; label: string; poster: ImageRef; url: string; duration?: string }
  | { kind: "image"; label: string; image: ImageRef };

export type Featured = {
  slug: string;
  name: string;
  status: GameStatus;
  genre: string;
  platformLabel: string;
  blurb: string;
  art: ImageRef;
  cta: { label: string; href: string };
  detailHref: string;
};

export type Cta = { label: string; href: string };

export type Game = {
  slug: string;
  name: string;
  status: GameStatus;
  genres: string[];
  platforms: string[];
  blurb: string;
  description: RichBody;
  keyArt: ImageRef;
  coverArt: ImageRef;
  media: Media[];
  features: { title: string; body: string }[];
  facts: { label: string; value: string }[];
  priceLabel: string | null;
  primaryCta: Cta | null;
  notify: { platform: string } | null;
  pressKitUrl: string | null;
  featured: boolean;
};

export type GameSummary = {
  slug: string;
  name: string;
  status: GameStatus;
  genre: string;
  platformLabel: string;
  cover: ImageRef;
};

export type PostSummary = {
  slug: string;
  title: string;
  /** ISO date. */
  date: string;
  kind: PostKind;
  excerpt: string | null;
  image: ImageRef;
  game: { slug: string; name: string } | null;
};

export type Post = PostSummary & { body: RichBody };

export type LegalPage = {
  slug: string;
  title: string;
  updatedAt: string | null;
  body: RichBody;
};

export type Faq = {
  id: string;
  question: string;
  answer: RichBody;
  game: { slug: string; name: string } | null;
};

export type SiteSettings = {
  supportEmail: string | null;
  socialLinks: { label: string; url: string }[];
  betaCallout: {
    eyebrow: string | null;
    title: string | null;
    body: string | null;
    game: { slug: string; name: string } | null;
    platforms: string[];
  } | null;
  newsletterBlurb: string | null;
  studioPhoto: ImageRef;
  foundedLine: string | null;
};
