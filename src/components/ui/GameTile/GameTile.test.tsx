import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import { GameTile } from "./GameTile";

const cover = { src: "/c.png", alt: "TerraForge cover", width: 600, height: 800 };

it("shows an accent OUT NOW chip when out now", () => {
  render(<GameTile name="TerraForge" href="/games/terraforge" cover={cover} status="out-now" meta="Sandbox · Web" />);
  expect(screen.getByText("OUT NOW")).toHaveAttribute("data-tone", "accent");
  expect(screen.getByRole("link")).toHaveAttribute("href", "/games/terraforge");
  expect(screen.getByAltText("TerraForge cover")).toBeVisible();
  expect(screen.getByText("Sandbox · Web")).toBeVisible();
});
it("shows an ink chip for other statuses", () => {
  render(<GameTile name="Space Cowboy" href="/g" cover={cover} status="coming-soon" meta="Puzzle" />);
  expect(screen.getByText("COMING SOON")).toHaveAttribute("data-tone", "ink");
});
it("renders a labelled placeholder when there is no cover", () => {
  render(<GameTile name="Strata" href="/g" cover={null} status="in-development" meta="Educational" size="s" />);
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.getAllByText("Strata").length).toBeGreaterThan(1);
  expect(screen.getByText("IN DEVELOPMENT")).toBeVisible();
});
