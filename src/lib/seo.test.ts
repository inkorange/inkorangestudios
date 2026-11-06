import { expect, it } from "vitest";
import { alt as ogAlt, size as ogSize } from "@/app/opengraph-image";
import { DEFAULT_SHARE_IMAGE, notFoundMetadata, pageMetadata, SITE_DESCRIPTION } from "./seo";

it("gives every page a canonical, Open Graph and Twitter card", () => {
  const meta = pageMetadata({ title: "About — inkOrange Studios", description: "Meet the studio.", path: "/about" });
  expect(meta).toEqual({
    title: "About — inkOrange Studios",
    description: "Meet the studio.",
    alternates: { canonical: "/about" },
    openGraph: {
      type: "website",
      siteName: "inkOrange Studios",
      locale: "en_US",
      url: "/about",
      title: "About — inkOrange Studios",
      description: "Meet the studio.",
      images: [DEFAULT_SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: "About — inkOrange Studios",
      description: "Meet the studio.",
      images: ["/opengraph-image"],
    },
  });
});

it("falls back to the site description when a page has none", () => {
  expect(pageMetadata({ title: "t", description: "  ", path: "/" }).description).toBe(SITE_DESCRIPTION);
  expect(pageMetadata({ title: "t", description: null, path: "/" }).description).toBe(SITE_DESCRIPTION);
});

it("uses a page image for both Open Graph and Twitter", () => {
  const meta = pageMetadata({ title: "t", path: "/games/x", image: { src: "https://cdn/k.jpg", alt: "Key art", width: 1200, height: 630 } });
  expect(meta.openGraph).toMatchObject({ images: [{ url: "https://cdn/k.jpg", width: 1200, height: 630, alt: "Key art" }] });
  expect(meta.twitter).toMatchObject({ images: ["https://cdn/k.jpg"] });
});

it("marks posts as articles with their publish date", () => {
  expect(pageMetadata({ title: "t", path: "/news/a", publishedTime: "2026-11-01" }).openGraph).toMatchObject({
    type: "article",
    publishedTime: "2026-11-01",
  });
});

it("keeps unfinished pages out of the index but lets links be followed", () => {
  expect(pageMetadata({ title: "t", path: "/terms", noindex: true }).robots).toEqual({ index: false, follow: true });
  expect(pageMetadata({ title: "t", path: "/terms" })).not.toHaveProperty("robots");
  expect(notFoundMetadata.robots).toEqual({ index: false, follow: true });
  expect(notFoundMetadata).not.toHaveProperty("alternates");
});

it("describes the generated share image as it really is", () => {
  expect(DEFAULT_SHARE_IMAGE).toMatchObject({ ...ogSize, alt: ogAlt });
});
