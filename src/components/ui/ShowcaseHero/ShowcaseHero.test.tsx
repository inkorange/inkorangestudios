import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { Featured } from "@/lib/sanity/types";
import { ShowcaseHero } from "./ShowcaseHero";

const make = (n: number, name: string, art: Featured["art"] = null): Featured => ({
  slug: `g${n}`,
  name,
  status: n === 1 ? "out-now" : "coming-soon",
  genre: "SANDBOX",
  platformLabel: "WEB",
  blurb: `${name} blurb`,
  art,
  cta: { label: `Play ${name}`, href: "https://example.com" },
  detailHref: `/games/g${n}`,
});
const games = [
  make(1, "TerraForge", { src: "/t.png", alt: "TerraForge art", width: 800, height: 600 }),
  make(2, "Space Cowboy"),
  make(3, "Mission Control"),
];

afterEach(() => vi.useRealTimers());

const next = () => screen.getByRole("button", { name: "Next featured game" });
const prev = () => screen.getByRole("button", { name: "Previous featured game" });

it("renders nothing for no games", () => {
  const { container } = render(<ShowcaseHero games={[]} />);
  expect(container).toBeEmptyDOMElement();
});

it("advances and wraps with next, wraps backwards with prev", () => {
  render(<ShowcaseHero games={games} />);
  expect(screen.getByText("01 / 03")).toBeInTheDocument();
  fireEvent.click(next());
  expect(screen.getByText("02 / 03")).toBeInTheDocument();
  fireEvent.click(next());
  fireEvent.click(next());
  expect(screen.getByText("01 / 03")).toBeInTheDocument();
  fireEvent.click(prev());
  expect(screen.getByText("03 / 03")).toBeInTheDocument();
});

it("never auto-advances", () => {
  vi.useFakeTimers();
  render(<ShowcaseHero games={games} />);
  act(() => {
    vi.advanceTimersByTime(30_000);
  });
  expect(screen.getByText("01 / 03")).toBeInTheDocument();
});

it("has no controls with a single game", () => {
  render(<ShowcaseHero games={[games[0]]} />);
  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.getByRole("heading", { name: "TerraForge" })).toBeInTheDocument();
});

it("exposes carousel semantics and announces changes only after the first render", () => {
  const { container } = render(<ShowcaseHero games={games} />);
  const region = screen.getByRole("region", { name: "Featured games" });
  expect(region).toHaveAttribute("aria-roledescription", "carousel");
  const slide = screen.getByRole("group", { name: "1 of 3" });
  expect(slide).toHaveAttribute("aria-roledescription", "slide");
  const live = container.querySelector("[aria-live='polite']");
  expect(live).toHaveTextContent("");
  fireEvent.click(next());
  expect(live).toHaveTextContent("Space Cowboy");
  expect(screen.getByRole("group", { name: "2 of 3" })).toBeInTheDocument();
});

it("moves with arrow keys when focus is inside", () => {
  render(<ShowcaseHero games={games} />);
  fireEvent.keyDown(next(), { key: "ArrowRight" });
  expect(screen.getByText("02 / 03")).toBeInTheDocument();
  fireEvent.keyDown(next(), { key: "ArrowLeft" });
  expect(screen.getByText("01 / 03")).toBeInTheDocument();
});

it("shows the active game's content, with links", () => {
  render(<ShowcaseHero games={games} />);
  expect(screen.getByRole("heading", { level: 1, name: "TerraForge" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Play TerraForge" })).toHaveAttribute("href", "https://example.com");
  expect(screen.getByRole("link", { name: "Game details" })).toHaveAttribute("href", "/games/g1");
  expect(screen.getByAltText("TerraForge art")).toBeInTheDocument();
});

it("phone dots are labelled buttons with aria-current", () => {
  render(<ShowcaseHero games={games} />);
  const dot = screen.getByRole("button", { name: "Show Space Cowboy" });
  expect(screen.getByRole("button", { name: "Show TerraForge" })).toHaveAttribute("aria-current", "true");
  fireEvent.click(dot);
  expect(dot).toHaveAttribute("aria-current", "true");
  expect(screen.getByText("02 / 03")).toBeInTheDocument();
});

it("selects a slide from the spotlight rail", () => {
  render(<ShowcaseHero games={games} />);
  fireEvent.click(screen.getByRole("button", { name: /^Mission Control/ }));
  expect(screen.getByText("03 / 03")).toBeInTheDocument();
});
