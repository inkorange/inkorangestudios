import type { PostSummary } from "@/lib/sanity/types";

/**
 * Where a news item goes: our own article at `/news/{slug}`, or the outside article,
 * with the publication's name (`source`) so the card can say where it opens.
 */
export function newsLink(post: PostSummary): { key: string; href: string; source?: string } {
  return post.format === "link"
    ? { key: post.id, href: post.url, source: post.source }
    : { key: post.slug, href: `/news/${post.slug}` };
}
