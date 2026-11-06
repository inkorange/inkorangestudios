import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { Featured } from "@/lib/sanity/types";
import { SpotlightRail } from "./SpotlightRail";

const g = (name: string, status: Featured["status"]): Featured => ({
  slug: name, name, status, genre: "PUZZLE", platformLabel: "WEB", blurb: "", art: null,
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
