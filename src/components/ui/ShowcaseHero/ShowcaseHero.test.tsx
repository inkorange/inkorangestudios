import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { Featured } from "@/lib/sanity/types";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img exposes the priority prop in jsdom
  default: ({ alt, src, priority }: { alt: string; src: string; priority?: boolean }) => <img alt={alt} src={src} data-priority={priority ? "true" : "false"} />,
}));

import { ShowcaseHero } from "./ShowcaseHero";

const make = (n: number, name: string, art: Featured["art"] = null): Featured => ({
  slug: `g${n}`,
  name,
  status: n === 1 ? "out-now" : "coming-soon",
  genre: "SANDBOX",
  platformLabel: "WEB",
  blurb: `${name} blurb`,
  art,
  icon: null,
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

it("renders the counter after the next button in the DOM", () => {
  render(<ShowcaseHero games={games} />);
  const counter = screen.getByText("01 / 03");
  expect(next().compareDocumentPosition(counter) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it("a single game is a plain section: no carousel or slide roles, no live region", () => {
  const { container } = render(<ShowcaseHero games={[games[0]]} />);
  const region = screen.getByRole("region", { name: "Featured games" });
  expect(region).not.toHaveAttribute("aria-roledescription");
  expect(container.querySelector("[aria-roledescription]")).toBeNull();
  expect(container.querySelector("[aria-live]")).toBeNull();
  expect(screen.queryByRole("group")).toBeNull();
});

it("ignores arrow keys with Alt, Ctrl or Meta held", () => {
  render(<ShowcaseHero games={games} />);
  fireEvent.keyDown(next(), { key: "ArrowRight", altKey: true });
  fireEvent.keyDown(next(), { key: "ArrowRight", ctrlKey: true });
  fireEvent.keyDown(next(), { key: "ArrowLeft", metaKey: true });
  expect(screen.getByText("01 / 03")).toBeInTheDocument();
});

it("clamps a stale index when the list shrinks", () => {
  const { rerender } = render(<ShowcaseHero games={games} />);
  fireEvent.click(prev()); // 03 / 03
  rerender(<ShowcaseHero games={games.slice(0, 2)} />);
  expect(screen.getByText("02 / 02")).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1, name: "Space Cowboy" })).toBeInTheDocument();
  fireEvent.click(next());
  expect(screen.getByText("01 / 02")).toBeInTheDocument();
});

it("gives only the first slide's art priority", () => {
  const withArt = [games[0], make(2, "Space Cowboy", { src: "/s.png", alt: "Space Cowboy art", width: 800, height: 600 })];
  render(<ShowcaseHero games={withArt} />);
  expect(screen.getByAltText("TerraForge art")).toHaveAttribute("data-priority", "true");
  fireEvent.click(next());
  expect(screen.getByAltText("Space Cowboy art")).toHaveAttribute("data-priority", "false");
});

it("shows the dark placeholder when a game has no art", () => {
  const { container } = render(<ShowcaseHero games={[games[1]]} />);
  expect(container.querySelector("[data-tone='dark']")).not.toBeNull();
  expect(screen.queryByRole("img")).toBeNull();
});

it("opens an external CTA in a new tab and keeps an internal one in the tab", () => {
  const internal = { ...games[1], cta: { label: "Join the beta", href: "#newsletter" } };
  render(<ShowcaseHero games={[games[0], internal]} />);
  expect(screen.getByRole("link", { name: /Play TerraForge/ })).toHaveAttribute("target", "_blank");
  fireEvent.click(next());
  expect(screen.getByRole("link", { name: "Join the beta" })).not.toHaveAttribute("target");
});

it("wraps the spotlight rail in a labelled group", () => {
  render(<ShowcaseHero games={games} />);
  const rail = screen.getByRole("group", { name: "Choose a featured game" });
  expect(rail).toContainElement(screen.getByRole("button", { name: /^Mission Control/ }));
});

it("hides an empty genre or platform: no empty chip, no stray separator", () => {
  const { container, rerender } = render(<ShowcaseHero games={[{ ...make(1, "Solo"), genre: "", platformLabel: "WEB" }]} />);
  expect(container.querySelector('[data-tone="outline-on-dark"]')).toBeNull();
  expect(container.querySelector('[data-tone="plain-on-dark"]')).toHaveTextContent("WEB");
  expect(screen.queryByText(/·/)).toBeNull();
  expect(screen.getAllByText("WEB")).toHaveLength(2); // chip (desktop) + meta line (phone)

  rerender(<ShowcaseHero games={[{ ...make(1, "Solo"), genre: "SIM", platformLabel: "" }]} />);
  expect(container.querySelector('[data-tone="plain-on-dark"]')).toBeNull();
  expect(screen.queryByText(/·/)).toBeNull();
  expect(screen.getAllByText("SIM")).toHaveLength(2);

  rerender(<ShowcaseHero games={[{ ...make(1, "Solo"), genre: "", platformLabel: "" }]} />);
  expect(container.querySelector('[data-tone="outline-on-dark"], [data-tone="plain-on-dark"]')).toBeNull();
  expect(screen.queryByText(/·/)).toBeNull();
});

it("joins genre and platform with a separator when both exist", () => {
  render(<ShowcaseHero games={[make(1, "Solo")]} />);
  expect(screen.getByText("SANDBOX · WEB")).toBeInTheDocument();
});
