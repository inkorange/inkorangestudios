import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

const nav = vi.hoisted(() => ({ pathname: null as string | null }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

import { SiteHeader } from "./SiteHeader";

it("opens the menu sheet from the toggle", async () => {
  render(<SiteHeader />);
  const toggle = screen.getByRole("button", { name: "Open menu" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("navigation", { name: "Menu" })).toBeNull();
  await userEvent.click(toggle);
  const close = screen.getByRole("button", { name: "Close menu" });
  expect(close).toHaveAttribute("aria-expanded", "true");
  const sheet = screen.getByRole("navigation", { name: "Menu" });
  expect(close.getAttribute("aria-controls")).toBe(sheet.id);
  expect(within(sheet).getByRole("link", { name: "Games" })).toHaveFocus();
  expect(within(sheet).getByRole("link", { name: "Get the newsletter" })).toHaveAttribute("href", "#newsletter");
});

it("closes on Escape and returns focus to the toggle", async () => {
  render(<SiteHeader />);
  await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
  await userEvent.keyboard("{Escape}");
  const toggle = screen.getByRole("button", { name: "Open menu" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(toggle).toHaveFocus();
  expect(screen.queryByRole("navigation", { name: "Menu" })).toBeNull();
});

it("closes when a sheet link is clicked", async () => {
  render(<SiteHeader />);
  await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
  await userEvent.click(within(screen.getByRole("navigation", { name: "Menu" })).getByRole("link", { name: "News" }));
  expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
});

it("closes the sheet when the viewport reaches the desktop breakpoint", async () => {
  let listener: ((e: { matches: boolean }) => void) | undefined;
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
      listener = cb;
    },
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  render(<SiteHeader />);
  await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
  act(() => listener?.({ matches: true }));
  expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
  // @ts-expect-error restore jsdom default (no matchMedia)
  delete window.matchMedia;
});

it("marks the active item in the desktop bar and the sheet", async () => {
  render(<SiteHeader active="support" />);
  expect(within(screen.getByRole("navigation", { name: "Primary" })).getByRole("link", { name: "Support" })).toHaveAttribute("aria-current", "page");
  await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
  expect(within(screen.getByRole("navigation", { name: "Menu" })).getByRole("link", { name: "Support" })).toHaveAttribute("aria-current", "page");
});

it("shows a back link in the game variant", () => {
  render(<SiteHeader variant="game" backLink={{ label: "Games", href: "/#games" }} />);
  const back = screen.getAllByRole("link", { name: "Games" }).find((a) => a.querySelector("svg"));
  expect(back).toBeDefined();
  expect(back).toHaveAttribute("href", "/#games");
  expect(back?.closest("[data-variant]")).toHaveAttribute("data-variant", "game");
});

it("has the desktop newsletter CTA", () => {
  render(<SiteHeader />);
  expect(screen.getAllByRole("link", { name: "Get the newsletter" })[0]).toHaveAttribute("href", "#newsletter");
});

it("derives the active section from the pathname", () => {
  nav.pathname = "/news/some-post";
  render(<SiteHeader />);
  expect(within(screen.getByRole("navigation", { name: "Primary" })).getByRole("link", { name: "News" })).toHaveAttribute("aria-current", "page");
  nav.pathname = null;
});

it("uses the game variant with Games active on a game page", () => {
  nav.pathname = "/games/terraforge";
  const { container } = render(<SiteHeader />);
  expect(container.querySelector("header")).toHaveAttribute("data-variant", "game");
  expect(within(screen.getByRole("navigation", { name: "Primary" })).getByRole("link", { name: "Games" })).toHaveAttribute("aria-current", "page");
  nav.pathname = null;
});

it("lets explicit props override the pathname", () => {
  nav.pathname = "/games/terraforge";
  const { container } = render(<SiteHeader active="press" variant="default" />);
  expect(container.querySelector("header")).toHaveAttribute("data-variant", "default");
  expect(within(screen.getByRole("navigation", { name: "Primary" })).getByRole("link", { name: "Press" })).toHaveAttribute("aria-current", "page");
  nav.pathname = null;
});
