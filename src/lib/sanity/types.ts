import type { GameStatus } from "@/lib/games";

export type ImageRef = { src: string; alt: string; width: number; height: number } | null;

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
