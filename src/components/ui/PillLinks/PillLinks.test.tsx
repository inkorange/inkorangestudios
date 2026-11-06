import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { PillLinks } from "./PillLinks";

const items = [
  { label: "All", href: "/news" },
  { label: "TerraForge", href: "/news?game=terraforge" },
];

it("renders a named nav of pill links with the current one marked", () => {
  render(<PillLinks label="Filter news by game" items={items} current="/news?game=terraforge" />);
  const nav = screen.getByRole("navigation", { name: "Filter news by game" });
  expect(nav).toBeInTheDocument();
  expect(screen.getByRole("list")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "TerraForge" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "TerraForge" })).toHaveAttribute("href", "/news?game=terraforge");
  expect(screen.getByRole("link", { name: "All" })).not.toHaveAttribute("aria-current");
});

it("renders nothing with fewer than two items", () => {
  const { container } = render(<PillLinks label="x" items={[items[0]]} current="/news" />);
  expect(container).toBeEmptyDOMElement();
});
