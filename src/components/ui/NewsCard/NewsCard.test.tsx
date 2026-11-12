import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import { NewsCard } from "./NewsCard";

it("formats the date in UTC with the kind label", () => {
  render(<NewsCard href="/news/a" image={null} date="2026-11-05" kind="update" title="Big update" />);
  expect(screen.getByText("NOV 5, 2026 · UPDATE")).toBeVisible();
  expect(screen.getByRole("link", { name: /Big update/ })).toHaveAttribute("href", "/news/a");
});
it("does not shift days with timezone-bearing ISO strings", () => {
  render(<NewsCard href="/n" image={null} date="2026-11-05T23:30:00-08:00" kind="patch-notes" title="T" />);
  expect(screen.getByText("NOV 6, 2026 · PATCH NOTES")).toBeVisible();
});
it("renders the image when given", () => {
  render(<NewsCard href="/n" image={{ src: "/i.png", alt: "Shot", width: 10, height: 10 }} date="2026-01-02" kind="devlog" title="T" />);
  expect(screen.getByAltText("Shot")).toBeVisible();
});
it("opens an outside article in a new tab and names where it was published", () => {
  render(<NewsCard href="https://example.com/a" image={null} date="2026-10-28" kind="update" title="About us" source="Example Gazette" />);
  const link = screen.getByRole("link", { name: /About us/ });
  expect(link).toHaveAttribute("href", "https://example.com/a");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
  expect(link).toHaveAccessibleName(expect.stringContaining("(opens in a new tab)"));
  expect(screen.getByText("OCT 28, 2026 · IN THE NEWS")).toBeVisible();
  expect(screen.getByText(/Read on Example Gazette/)).toBeVisible();
});
it("keeps our own articles in the same tab", () => {
  render(<NewsCard href="/news/a" image={null} date="2026-11-05" kind="update" title="Ours" />);
  expect(screen.getByRole("link", { name: /Ours/ })).not.toHaveAttribute("target");
  expect(screen.queryByText(/Read on/)).toBeNull();
});
