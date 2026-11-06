import { render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import { GameTitle } from "./GameTitle";

const crumbs = [{ label: "Games", href: "/#games" }, { label: "TerraForge" }];

const tones = (list: Element | null) => [...(list?.querySelectorAll("[data-tone]") ?? [])].map((el) => [el.textContent, el.getAttribute("data-tone")]);
const follows = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

it("renders the breadcrumb, the status chip above the h1 and the genre chips under it", () => {
  render(<GameTitle name="TerraForge" status="out-now" tags={["Sandbox", "Creative"]} crumbs={crumbs} />);
  const trail = screen.getByRole("navigation", { name: "Breadcrumb" });
  expect(within(trail).getByRole("link", { name: "Games" })).toHaveAttribute("href", "/#games");
  expect(within(trail).getByText("TerraForge")).toHaveAttribute("aria-current", "page");
  const h1 = screen.getByRole("heading", { level: 1, name: "TerraForge" });
  const status = screen.getByRole("list", { name: "Status and platforms" });
  const genres = screen.getByRole("list", { name: "Genres" });
  expect(tones(status)).toEqual([["OUT NOW", "accent"]]);
  expect(tones(genres)).toEqual([
    ["Sandbox", "outline"],
    ["Creative", "outline"],
  ]);
  expect(follows(trail, status) && follows(status, h1) && follows(h1, genres)).toBe(true);
});

it("has no genre list without genres", () => {
  render(<GameTitle name="X" status="out-now" tags={[" "]} crumbs={crumbs} />);
  expect(screen.queryByRole("list", { name: "Genres" })).toBeNull();
});

it("drops duplicate and empty tags", () => {
  render(<GameTitle name="X" status="coming-soon" tags={["Web", " ", "Web", "Puzzle"]} crumbs={crumbs} />);
  expect(tones(screen.getByRole("list", { name: "Genres" })).map(([text]) => text)).toEqual(["Web", "Puzzle"]);
});

it("shows the phone lead only when given", () => {
  const { rerender, container } = render(<GameTitle name="X" status="out-now" tags={[]} crumbs={crumbs} />);
  expect(container.querySelector("[data-lead]")).toBeNull();
  rerender(<GameTitle name="X" status="out-now" tags={[]} crumbs={crumbs} lead="Build planets." />);
  expect(screen.getByText("Build planets.")).toHaveAttribute("data-lead", "phone");
});

it("shows each platform after the status, above the name, as an outline chip with its logo", () => {
  render(<GameTitle name="X" status="out-now" tags={["Puzzle"]} platforms={["Android", "iOS", "Web"]} crumbs={crumbs} />);
  const chips = [...screen.getByRole("list", { name: "Status and platforms" }).querySelectorAll("[data-tone]")];
  expect(chips.map((el) => el.textContent)).toEqual(["OUT NOW", "Android", "iOS", "Web"]);
  expect(chips.slice(1).map((el) => el.getAttribute("data-icon"))).toEqual(["true", "true", "true"]);
  expect(tones(screen.getByRole("list", { name: "Genres" }))).toEqual([["Puzzle", "outline"]]);
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
