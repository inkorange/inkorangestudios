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
