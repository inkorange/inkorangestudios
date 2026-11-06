import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { Featured } from "@/lib/sanity/types";
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import { SpotlightRail } from "./SpotlightRail";

const g = (name: string, status: Featured["status"]): Featured => ({
  slug: name, name, status, genre: "PUZZLE", platformLabel: "WEB", blurb: "", art: null, icon: null,
  cta: { label: "Go", href: "/" }, detailHref: "/",
});
const games = [g("One", "out-now"), g("Two", "coming-soon")];

it("lists games with genre and status and marks the active one", () => {
  render(<SpotlightRail games={games} activeIndex={1} onPick={() => {}} />);
  expect(screen.getByText("PUZZLE · COMING SOON")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Two/ })).toHaveAttribute("aria-current", "true");
  expect(screen.getByRole("button", { name: /One/ })).not.toHaveAttribute("aria-current");
});

it("reports the picked index", () => {
  const onPick = vi.fn();
  render(<SpotlightRail games={games} activeIndex={0} onPick={onPick} />);
  fireEvent.click(screen.getByRole("button", { name: /Two/ }));
  expect(onPick).toHaveBeenCalledWith(1);
});

it("is a group labelled for choosing a featured game", () => {
  render(<SpotlightRail games={games} activeIndex={0} onPick={() => {}} />);
  expect(screen.getByRole("group", { name: "Choose a featured game" })).toBeInTheDocument();
});

it("prefers the app icon for the thumbnail, falling back to the key art", () => {
  const art = { src: "/art.jpg", alt: "Art", width: 2000, height: 1000 };
  const { container } = render(
    <SpotlightRail games={[{ ...g("One", "out-now"), art, icon: { src: "https://cdn.sanity.io/images/p/d/icon-512x512.png?w=256", alt: "TerraForge app icon", width: 256, height: 256 } }, { ...g("Two", "coming-soon"), art }]} activeIndex={0} onPick={() => {}} />,
  );
  expect([...container.querySelectorAll("img")].map((i) => i.getAttribute("src"))).toEqual(["https://cdn.sanity.io/images/p/d/icon-512x512.png?w=256", "/art.jpg"]);
});
