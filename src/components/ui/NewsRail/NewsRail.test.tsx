import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import type { PostSummary } from "@/lib/sanity/types";
import { NewsRail } from "./NewsRail";

const post = (slug: string, title: string): PostSummary => ({
  slug,
  title,
  date: "2026-11-05",
  kind: "devlog",
  excerpt: null,
  image: null,
  game: null,
});

it("renders one linked card per post in a list", () => {
  render(<NewsRail posts={[post("a", "First"), post("b", "Second")]} />);
  const list = screen.getByRole("list", { name: "Latest news" });
  const links = within(list).getAllByRole("link");
  expect(links.map((l) => l.getAttribute("href"))).toEqual(["/news/a", "/news/b"]);
  expect(screen.getAllByText("NOV 5, 2026 · DEVLOG")).toHaveLength(2);
});

it("renders nothing without posts", () => {
  const { container } = render(<NewsRail posts={[]} />);
  expect(container).toBeEmptyDOMElement();
});
