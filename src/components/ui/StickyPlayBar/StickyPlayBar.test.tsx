import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

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

it("hides the meta line when none is given", () => {
  const { container } = render(<StickyPlayBar title="TerraForge" action={{ label: "Go", href: "/play" }} />);
  expect(container.querySelectorAll("span > span")).toHaveLength(1);
});

it("starts with the app icon when there is one", () => {
  const { container, rerender } = render(<StickyPlayBar title="TerraForge" action={{ label: "Play now", href: "/" }} icon={{ src: "https://cdn.sanity.io/images/p/d/icon-512x512.png?w=256", alt: "TerraForge app icon", width: 256, height: 256 }} />);
  expect(container.querySelector("img")).toHaveAttribute("alt", "");
  expect(container.querySelector("[data-icon]")).toHaveAttribute("data-icon", "true");
  rerender(<StickyPlayBar title="TerraForge" action={{ label: "Play now", href: "/" }} />);
  expect(container.querySelector("img")).toBeNull();
});
