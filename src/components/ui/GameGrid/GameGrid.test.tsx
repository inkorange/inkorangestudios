import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import type { GameSummary } from "@/lib/sanity/types";
import { GameGrid } from "./GameGrid";

const game = (slug: string, name: string, status: GameSummary["status"]): GameSummary => ({
  slug,
  name,
  status,
  genre: "Sandbox",
  platformLabel: "Web",
  cover: null,
  stores: [],
});
const games = [
  game("terraforge", "TerraForge", "out-now"),
  game("space-cowboy", "Space Cowboy", "coming-soon"),
  game("strata", "Strata", "in-development"),
  game("next", "Next One", "announcing-soon"),
  game("mission-control", "Mission Control", "out-now"),
];

const tileNames = () =>
  within(screen.getByRole("list", { name: "Games" }))
    .getAllByRole("link")
    .map((a) => a.getAttribute("href"));

it("shows every game under All, with the section heading and filter group", () => {
  render(<GameGrid games={games} />);
  expect(screen.getByRole("heading", { level: 2, name: "All games" })).toBeInTheDocument();
  const filters = screen.getByRole("group", { name: "Filter games" });
  expect(within(filters).getAllByRole("button").map((b) => b.textContent)).toEqual(["All", "Out now", "Coming soon"]);
  expect(within(filters).getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
  expect(tileNames()).toHaveLength(5);
});

it("Out now shows only out-now games", () => {
  render(<GameGrid games={games} />);
  fireEvent.click(screen.getByRole("button", { name: "Out now" }));
  expect(tileNames()).toEqual(["/games/terraforge", "/games/mission-control"]);
});

it("Coming soon shows every status except out-now", () => {
  render(<GameGrid games={games} />);
  fireEvent.click(screen.getByRole("button", { name: "Coming soon" }));
  expect(tileNames()).toEqual(["/games/space-cowboy", "/games/strata", "/games/next"]);
  expect(screen.getByRole("button", { name: "Coming soon" })).toHaveAttribute("aria-pressed", "true");
});

it("links each tile to its game page with a genre · platform line", () => {
  render(<GameGrid games={[games[0]]} />);
  expect(screen.getByRole("link", { name: /TerraForge/ })).toHaveAttribute("href", "/games/terraforge");
  expect(screen.getByText("Sandbox · Web")).toBeInTheDocument();
});

it("with no games shows the empty message and no filters", () => {
  render(<GameGrid games={[]} />);
  expect(screen.getByText("New games are on the way.")).toBeInTheDocument();
  expect(screen.queryByRole("group")).toBeNull();
  expect(screen.queryByRole("list")).toBeNull();
});

it("a filter with no matches shows the empty message", () => {
  render(<GameGrid games={[games[1]]} />);
  fireEvent.click(screen.getByRole("button", { name: "Out now" }));
  expect(screen.getByText("New games are on the way.")).toBeInTheDocument();
});

it("puts a game's app store badges under its tile, outside the tile's link", () => {
  const stores = [{ platform: "iOS", href: "https://apps.apple.com/app/id1" }] as GameSummary["stores"];
  render(<GameGrid games={[{ ...game("space-cowboy", "Space Cowboy", "coming-soon"), stores }, game("terraforge", "TerraForge", "out-now")]} />);
  const badges = screen.getByRole("list", { name: "Space Cowboy in the app stores" });
  const badge = within(badges).getByRole("link", { name: "Download on the App Store" });
  expect(badge).toHaveAttribute("href", "https://apps.apple.com/app/id1");
  expect(badge.closest('a[href="/games/space-cowboy"]')).toBeNull();
  expect(screen.queryByRole("list", { name: "TerraForge in the app stores" })).toBeNull();
});
