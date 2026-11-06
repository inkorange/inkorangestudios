import { readdirSync } from "node:fs";
import path from "node:path";
import { render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import tokens from "@/styles/tokens.json";

vi.mock("next/navigation", () => ({ usePathname: () => "/design" }));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import { DesignGallery, GALLERY_COMPONENTS } from "./DesignGallery";

const uiDir = path.resolve(import.meta.dirname, "..");
const uiFolders = readdirSync(uiDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== "DesignGallery")
  .map((d) => d.name)
  .sort();

it("has a gallery entry for every folder in src/components/ui (and no others)", () => {
  expect([...GALLERY_COMPONENTS].sort()).toEqual(uiFolders);
});

it("renders a labelled specimen for every component", () => {
  render(<DesignGallery />);
  for (const name of GALLERY_COMPONENTS) {
    const specimen = screen.getByRole("region", { name });
    expect(specimen).toBeInTheDocument();
    expect(within(specimen).getByRole("heading", { level: 3, name })).toBeInTheDocument();
  }
});

it("shows every token in tokens.json with its value", () => {
  const { container } = render(<DesignGallery />);
  const text = container.textContent ?? "";
  for (const token of tokens.tokens) expect(text, token.name).toContain(token.name);
  const accent = screen.getByText("--color-accent").closest("[data-token]");
  expect(accent).toHaveTextContent("#E08D00");
  const xl = screen.getByText("--text-display-xl").closest("[data-token]");
  expect(xl).toHaveTextContent("68 → 112px");
});

it("titles the page and groups the tokens", () => {
  render(<DesignGallery />);
  expect(screen.getByRole("heading", { level: 1, name: "Design system" })).toBeInTheDocument();
  for (const group of ["Color", "Typography", "Spacing", "Layout and sizes", "Radius", "Motion", "Layers", "Components"]) {
    expect(screen.getByRole("heading", { level: 2, name: group })).toBeInTheDocument();
  }
});
