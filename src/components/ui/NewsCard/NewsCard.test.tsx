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
