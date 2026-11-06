import { render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { GameSummary } from "@/lib/sanity/types";
import { MoreGames } from "./MoreGames";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

const games: GameSummary[] = [
  { slug: "mission-control", name: "Mission Control", status: "out-now", genre: "Simulation", platformLabel: "Web", cover: null, stores: [] },
  { slug: "space-cowboy", name: "Space Cowboy", status: "coming-soon", genre: "Puzzle", platformLabel: "iOS · Android", cover: null, stores: [] },
];

it("renders a header with the All games link and a list of small tiles", () => {
  const { container } = render(<MoreGames games={games} />);
  expect(screen.getByRole("heading", { level: 2, name: "More from inkOrange" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "All games →" })).toHaveAttribute("href", "/#games");
  const list = screen.getByRole("list", { name: "More games" });
  const tiles = within(list).getAllByRole("link");
  expect(tiles.map((t) => t.getAttribute("href"))).toEqual(["/games/mission-control", "/games/space-cowboy"]);
  expect(within(list).getByText("Puzzle · iOS · Android")).toBeInTheDocument();
  expect(container.querySelectorAll('li > [data-size="s"]')).toHaveLength(2);
});

it("renders nothing without games", () => {
  const { container } = render(<MoreGames games={[]} />);
  expect(container).toBeEmptyDOMElement();
});
