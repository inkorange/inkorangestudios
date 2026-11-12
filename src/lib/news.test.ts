import { expect, it } from "vitest";
import type { PostSummary } from "@/lib/sanity/types";
import { newsLink } from "./news";

const base = { title: "T", date: "2026-10-28", kind: "update", excerpt: null, image: null, game: null } as const;

it("sends an article to its page", () => {
  const post: PostSummary = { ...base, format: "article", slug: "hello" };
  expect(newsLink(post)).toEqual({ key: "hello", href: "/news/hello" });
});

it("sends a link post to the outside article and names the publication", () => {
  const post: PostSummary = { ...base, format: "link", id: "p1", url: "https://example.com/a", source: "Example" };
  expect(newsLink(post)).toEqual({ key: "p1", href: "https://example.com/a", source: "Example" });
});
