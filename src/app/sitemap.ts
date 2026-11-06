import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";
import { getGameSlugs, getLegalPage, getPosts } from "@/lib/sanity/content";

export const revalidate = 3600;

const LEGAL = ["privacy", "terms"] as const;

/** Public pages only: /studio, /design and /api are never listed (robots.ts disallows them). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.siteUrl.replace(/\/+$/, "");
  const [slugs, posts, legal] = await Promise.all([getGameSlugs(), getPosts(), Promise.all(LEGAL.map((slug) => getLegalPage(slug)))]);

  return [
    { url: `${base}/` },
    { url: `${base}/about` },
    { url: `${base}/support` },
    { url: `${base}/news` },
    ...slugs.map((slug) => ({ url: `${base}/games/${slug}` })),
    ...posts.map((post) => ({ url: `${base}/news/${post.slug}`, lastModified: post.date })),
    // Legal pages without copy render the noindex empty state, so they stay out until written.
    ...legal.flatMap((page, i) =>
      page && page.body.length > 0 ? [{ url: `${base}/${LEGAL[i]}`, ...(page.updatedAt ? { lastModified: page.updatedAt } : {}) }] : [],
    ),
  ];
}
