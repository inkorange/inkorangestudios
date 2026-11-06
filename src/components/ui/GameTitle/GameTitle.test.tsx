import { render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import { GameTitle } from "./GameTitle";

const crumbs = [{ label: "Games", href: "/#games" }, { label: "TerraForge" }];

it("renders the breadcrumb, the h1 and the chips: status in accent, tags in outline", () => {
  const { container } = render(<GameTitle name="TerraForge" status="out-now" tags={["Sandbox", "Creative", "Web"]} crumbs={crumbs} />);
  const trail = screen.getByRole("navigation", { name: "Breadcrumb" });
  expect(within(trail).getByRole("link", { name: "Games" })).toHaveAttribute("href", "/#games");
  expect(within(trail).getByText("TerraForge")).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("heading", { level: 1, name: "TerraForge" })).toBeInTheDocument();
  const chips = [...container.querySelectorAll("ul [data-tone]")].map((el) => [el.textContent, el.getAttribute("data-tone")]);
  expect(chips).toEqual([
    ["OUT NOW", "accent"],
    ["Sandbox", "outline"],
    ["Creative", "outline"],
    ["Web", "outline"],
  ]);
});

it("drops duplicate and empty tags", () => {
  const { container } = render(<GameTitle name="X" status="coming-soon" tags={["Web", " ", "Web", "Puzzle"]} crumbs={crumbs} />);
  expect([...container.querySelectorAll('ul [data-tone="outline"]')].map((el) => el.textContent)).toEqual(["Web", "Puzzle"]);
});

it("shows the phone lead only when given", () => {
  const { rerender, container } = render(<GameTitle name="X" status="out-now" tags={[]} crumbs={crumbs} />);
  expect(container.querySelector("[data-lead]")).toBeNull();
  rerender(<GameTitle name="X" status="out-now" tags={[]} crumbs={crumbs} lead="Build planets." />);
  expect(screen.getByText("Build planets.")).toHaveAttribute("data-lead", "phone");
});

it("shows each platform last, as an outline chip with its logo", () => {
  const { container } = render(<GameTitle name="X" status="out-now" tags={["Puzzle"]} platforms={["Android", "iOS", "Web"]} crumbs={crumbs} />);
  const chips = [...container.querySelectorAll('ul [data-tone="outline"]')];
  expect(chips.map((el) => el.textContent)).toEqual(["Puzzle", "Android", "iOS", "Web"]);
  expect(chips.map((el) => el.getAttribute("data-icon"))).toEqual(["false", "true", "true", "true"]);
});

it("shows the app icon beside the name, hidden from screen readers since the name is right there", () => {
  const { container } = render(<GameTitle name="TerraForge" icon={{ src: "https://cdn.sanity.io/images/p/d/icon-512x512.png?w=256", alt: "TerraForge app icon", width: 256, height: 256 }} status="out-now" tags={[]} crumbs={crumbs} />);
  const img = container.querySelector("img")!;
  expect(img).toHaveAttribute("alt", "");
  expect(img.nextElementSibling).toBe(screen.getByRole("heading", { level: 1, name: "TerraForge" }));
});

it("has no image without an app icon", () => {
  const { container } = render(<GameTitle name="TerraForge" status="out-now" tags={[]} crumbs={crumbs} />);
  expect(container.querySelector("img")).toBeNull();
});
