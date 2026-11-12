import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { NavPillBar } from "./NavPillBar";

it("marks the active item with aria-current=page", () => {
  render(<NavPillBar active="news" />);
  expect(screen.getByRole("link", { name: "News" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Games" })).not.toHaveAttribute("aria-current");
});

it("renders all five items in a labelled nav", () => {
  render(<NavPillBar />);
  expect(screen.getByRole("navigation", { name: "Primary" })).toBeVisible();
  expect(screen.getAllByRole("link").map((a) => a.textContent)).toEqual(["Games", "Learn", "Studio", "News", "Support"]);
  expect(screen.getByRole("link", { name: "Studio" })).toHaveAttribute("href", "/about");
  expect(screen.getByRole("link", { name: "Learn" })).toHaveAttribute("href", "/learn");
});

it("uses aria-current=true for a section-level match", () => {
  render(<NavPillBar active="news" current="true" />);
  expect(screen.getByRole("link", { name: "News" })).toHaveAttribute("aria-current", "true");
});
