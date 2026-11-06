import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
const analytics = vi.hoisted(() => vi.fn((props: { gtmId?: string }) => <span data-testid="analytics" data-gtm={props.gtmId ?? ""} />));
vi.mock("@/components/analytics/Analytics", () => ({ Analytics: analytics }));
vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>();
  return { ...actual, publicEnv: { ...actual.publicEnv, gtmId: "GTM-TEST123" } };
});

import SiteLayout from "./layout";

beforeEach(() => {
  localStorage.clear();
});

it("wraps the page in the header, consent banner and analytics", () => {
  render(<SiteLayout>{<p>Page body</p>}</SiteLayout>);
  expect(screen.getByRole("banner")).toBeInTheDocument();
  expect(within(screen.getByRole("navigation", { name: "Primary" })).getByRole("link", { name: "Games" })).toHaveAttribute("aria-current", "true");
  expect(screen.getByText("Page body")).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Cookie consent" })).toBeInTheDocument();
  expect(screen.getByTestId("analytics")).toHaveAttribute("data-gtm", "GTM-TEST123");
  expect(analytics.mock.calls[0][0]).toEqual({ gtmId: "GTM-TEST123" });
});

it("leaves <main> and the footer to the leaf layouts, which pick the footer variant", () => {
  render(<SiteLayout>{<p>Page body</p>}</SiteLayout>);
  expect(screen.queryByRole("main")).toBeNull();
  expect(screen.queryByRole("contentinfo")).toBeNull();
});
