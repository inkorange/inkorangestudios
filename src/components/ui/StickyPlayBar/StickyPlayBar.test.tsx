import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { StickyPlayBar } from "./StickyPlayBar";

it("shows title, meta and an action link", () => {
  render(<StickyPlayBar title="TerraForge" meta="Free · Web" action={{ label: "Play now", href: "https://example.com/play" }} />);
  expect(screen.getByText("TerraForge")).toBeInTheDocument();
  expect(screen.getByText("Free · Web")).toBeInTheDocument();
  const link = screen.getByRole("link", { name: "Play now" });
  expect(link).toHaveAttribute("href", "https://example.com/play");
  expect(link).toHaveAttribute("target", "_blank");
});

it("keeps internal actions in the same tab", () => {
  render(<StickyPlayBar title="T" meta="m" action={{ label: "Go", href: "/play" }} />);
  expect(screen.getByRole("link", { name: "Go" })).not.toHaveAttribute("target");
});

it("is a labelled complementary landmark", () => {
  render(<StickyPlayBar title="TerraForge" meta="m" action={{ label: "Go", href: "/play" }} />);
  expect(screen.getByRole("complementary", { name: "TerraForge quick play" })).toBeInTheDocument();
});
