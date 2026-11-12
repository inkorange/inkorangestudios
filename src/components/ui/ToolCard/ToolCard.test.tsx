import { render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { Tool } from "@/lib/sanity/types";
import { ToolCard } from "./ToolCard";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

const molecular: Tool = {
  name: "Molecular",
  status: "out-now",
  summary: "Build atoms and molecules in 3D.",
  url: "https://molecular.chriswest.tech/",
  image: { src: "https://cdn.sanity.io/m.png", alt: "Molecular", width: 1600, height: 900 },
  links: [{ label: "Read how Molecular was built", href: "https://www.chriswest.tech/project/molecular" }],
};

it("shows the status, name, summary and a Try it free button that opens the tool in a new tab", () => {
  render(<ToolCard tool={molecular} />);
  expect(screen.getByText("OUT NOW")).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 3, name: "Molecular" })).toBeInTheDocument();
  expect(screen.getByText("Build atoms and molecules in 3D.")).toBeInTheDocument();
  const button = screen.getByRole("link", { name: "Try it free: Molecular (opens in a new tab)" });
  expect(button).toHaveAttribute("href", "https://molecular.chriswest.tech/");
  expect(button).toHaveAttribute("target", "_blank");
});

it("links the banner too, but keeps it out of the keyboard and screen reader order", () => {
  const { container } = render(<ToolCard tool={molecular} />);
  const banner = container.querySelector('a[aria-hidden="true"]')!;
  expect(banner).toHaveAttribute("href", "https://molecular.chriswest.tech/");
  expect(banner).toHaveAttribute("tabindex", "-1");
  expect(screen.getAllByRole("link")).toHaveLength(2);
});

it("lists extra links about the tool, each opening in a new tab", () => {
  render(<ToolCard tool={molecular} />);
  const list = screen.getByRole("list", { name: "More about Molecular" });
  const link = within(list).getByRole("link", { name: /Read how Molecular was built/ });
  expect(link).toHaveAttribute("href", "https://www.chriswest.tech/project/molecular");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
  expect(link).toHaveAccessibleName(/^Read how Molecular was built\s*\(opens in a new tab\)$/);
});

it("a tool still on the way shows its status but no button or linked banner", () => {
  const { container } = render(<ToolCard tool={{ ...molecular, status: "in-development", links: [] }} />);
  expect(screen.getByText("IN DEVELOPMENT")).toBeInTheDocument();
  expect(screen.queryByRole("link")).toBeNull();
  expect(container.querySelector("a")).toBeNull();
});

it("an out-now tool with no URL gets no button", () => {
  render(<ToolCard tool={{ ...molecular, url: null, links: [] }} />);
  expect(screen.queryByRole("link")).toBeNull();
});

it("uses a placeholder without a banner, an h2 when asked, and no list without links", () => {
  render(<ToolCard tool={{ ...molecular, image: null, summary: null, links: [] }} headingLevel="h2" />);
  expect(screen.getByRole("heading", { level: 2, name: "Molecular" })).toBeInTheDocument();
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.queryByRole("list")).toBeNull();
});
