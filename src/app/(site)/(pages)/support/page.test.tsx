import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { GameSummary, SiteSettings } from "@/lib/sanity/types";

const content = vi.hoisted(() => ({ getFaqs: vi.fn(), getGames: vi.fn(), getSettings: vi.fn() }));
vi.mock("@/lib/sanity/content", () => content);

import Support, { revalidate } from "./page";

const settings = (supportEmail: string | null) => ({ supportEmail }) as SiteSettings;
const game = { slug: "terraforge", name: "TerraForge" } as GameSummary;
const answer = [{ _type: "block", _key: "a", style: "normal", markDefs: [], children: [{ _type: "span", _key: "s", text: "Answer text", marks: [] }] }];

beforeEach(() => {
  content.getFaqs.mockResolvedValue([]);
  content.getGames.mockResolvedValue([]);
  content.getSettings.mockResolvedValue(settings(null));
});

it("revalidates hourly", () => expect(revalidate).toBe(3600));

it("with no FAQs, games or email shows the coming-soon note and hides the rest", async () => {
  render(await Support());
  expect(screen.getByRole("heading", { level: 1, name: "Support" })).toBeInTheDocument();
  expect(screen.getByText("FAQs are coming soon.")).toBeInTheDocument();
  expect(screen.queryByText("Game help")).toBeNull();
  expect(screen.queryByText(/@/)).toBeNull();
  expect(screen.getByRole("link", { name: "Send us a message" })).toHaveAttribute("href", "/about#contact");
});

it("lists FAQs, game help links and the support email when present", async () => {
  content.getFaqs.mockResolvedValue([{ id: "1", question: "How do I reset?", answer, game: null }]);
  content.getGames.mockResolvedValue([game]);
  content.getSettings.mockResolvedValue(settings("help@example.com"));
  render(await Support());
  expect(screen.getByText("How do I reset?")).toBeInTheDocument();
  expect(screen.queryByText("FAQs are coming soon.")).toBeNull();
  expect(screen.getByRole("link", { name: "TerraForge" })).toHaveAttribute("href", "/games/terraforge");
  expect(screen.getByRole("link", { name: "help@example.com" })).toHaveAttribute("href", "mailto:help@example.com");
});
