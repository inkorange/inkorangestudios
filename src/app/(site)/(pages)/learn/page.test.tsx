import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { Tool } from "@/lib/sanity/types";

const content = vi.hoisted(() => ({ getTools: vi.fn() }));
vi.mock("@/lib/sanity/content", () => content);
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import Learn, { metadata, revalidate } from "./page";

const tool = (name: string): Tool => ({ name, status: "out-now", summary: null, url: "https://example.com", image: null, links: [] });

beforeEach(() => content.getTools.mockReset());

it("revalidates hourly and has a title and canonical path", () => {
  expect(revalidate).toBe(3600);
  expect(metadata.title).toBe("Educational tools — inkOrange Studios");
  expect(metadata.alternates).toEqual({ canonical: "/learn" });
});

it("lists every tool as an h2 under the page h1", async () => {
  content.getTools.mockResolvedValue([tool("Molecular"), tool("Solar"), tool("Strata")]);
  render(await Learn());
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Free tools for curious classrooms.");
  expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(["Molecular", "Solar", "Strata"]);
});

it("says more are coming when there are no tools", async () => {
  content.getTools.mockResolvedValue([]);
  render(await Learn());
  expect(screen.getByText("New tools are on the way. Check back soon.")).toBeInTheDocument();
  expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
});
