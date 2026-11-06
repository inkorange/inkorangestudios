import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
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
