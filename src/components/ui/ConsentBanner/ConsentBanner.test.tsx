import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { openConsent } from "@/lib/consent";
import { ConsentBanner } from "./ConsentBanner";

afterEach(() => localStorage.clear());

it("shows when no choice is stored and Accept writes granted", async () => {
  render(<ConsentBanner />);
  expect(screen.getByText(/We use cookies to understand how the site is used/)).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "Accept" }));
  expect(localStorage.getItem("io-consent")).toBe("granted");
  expect(screen.queryByRole("region", { name: "Cookie consent" })).toBeNull();
});

it("Decline writes denied", async () => {
  render(<ConsentBanner />);
  await userEvent.click(screen.getByRole("button", { name: "Decline" }));
  expect(localStorage.getItem("io-consent")).toBe("denied");
});

it("is hidden when a choice exists, and reopens on io:consent-open", () => {
  localStorage.setItem("io-consent", "denied");
  render(<ConsentBanner />);
  expect(screen.queryByRole("region", { name: "Cookie consent" })).toBeNull();
  act(() => openConsent());
  expect(screen.getByRole("region", { name: "Cookie consent" })).toBeVisible();
});
