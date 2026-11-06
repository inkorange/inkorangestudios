import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

const content = vi.hoisted(() => ({ getLegalPage: vi.fn() }));
vi.mock("@/lib/sanity/content", () => content);

import Privacy, { generateMetadata, revalidate } from "./page";

const body = [{ _type: "block", _key: "a", style: "normal", markDefs: [], children: [{ _type: "span", _key: "s", text: "We keep it simple.", marks: [] }] }];

beforeEach(() => content.getLegalPage.mockReset());

it("revalidates hourly", () => expect(revalidate).toBe(3600));

it("without content shows the empty state and is not indexed", async () => {
  content.getLegalPage.mockResolvedValue(null);
  render(await Privacy());
  expect(screen.getByText("This page is being written.")).toBeInTheDocument();
  const meta = await generateMetadata();
  expect(meta.robots).toEqual({ index: false });
  expect(meta.title).toBe("Privacy policy — inkOrange Studios");
});

it("with content shows title, last updated and body", async () => {
  content.getLegalPage.mockResolvedValue({ slug: "privacy", title: "Privacy", updatedAt: "2026-11-05T10:00:00Z", body });
  render(await Privacy());
  expect(screen.getByRole("heading", { level: 1, name: "Privacy policy" })).toBeInTheDocument();
  expect(screen.getByText("Last updated Nov 5, 2026")).toBeInTheDocument();
  expect(screen.getByText("We keep it simple.")).toBeInTheDocument();
  expect((await generateMetadata()).robots).toBeUndefined();
});

it("with an empty body shows the empty state and is not indexed", async () => {
  content.getLegalPage.mockResolvedValue({ slug: "privacy", title: "Privacy", updatedAt: "2026-11-05T10:00:00Z", body: [] });
  render(await Privacy());
  expect(screen.getByText("This page is being written.")).toBeInTheDocument();
  expect(screen.queryByText(/Last updated/)).not.toBeInTheDocument();
  expect((await generateMetadata()).robots).toEqual({ index: false });
});
