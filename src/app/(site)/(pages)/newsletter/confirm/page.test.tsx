import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

const confirmSubscription = vi.hoisted(() => vi.fn());
vi.mock("@/lib/newsletter/subscribers", () => ({ confirmSubscription }));

import NewsletterConfirm, { dynamic, metadata } from "./page";

const run = async (sp: Record<string, string | string[] | undefined>) =>
  render(await NewsletterConfirm({ searchParams: Promise.resolve(sp) }));

beforeEach(() => vi.clearAllMocks());

it("is dynamic and noindex", () => {
  expect(dynamic).toBe("force-dynamic");
  expect(metadata.robots).toMatchObject({ index: false });
});

it("confirmed", async () => {
  confirmSubscription.mockResolvedValue("confirmed");
  await run({ token: "abc" });
  expect(confirmSubscription).toHaveBeenCalledWith("abc");
  expect(screen.getByRole("heading", { level: 1, name: "You're subscribed" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to the home page" })).toHaveAttribute("href", "/");
});

it("expired", async () => {
  confirmSubscription.mockResolvedValue("expired");
  await run({ token: "abc" });
  expect(screen.getByText("This link has expired. Sign up again in the footer.")).toBeInTheDocument();
});

it("invalid, and a missing or repeated token is treated as empty", async () => {
  confirmSubscription.mockResolvedValue("invalid");
  await run({});
  expect(confirmSubscription).toHaveBeenLastCalledWith("");
  expect(screen.getByText("This link isn't valid.")).toBeInTheDocument();
  await run({ token: ["a", "b"] });
  expect(confirmSubscription).toHaveBeenLastCalledWith("");
});
