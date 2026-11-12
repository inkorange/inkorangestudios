import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { SiteFooter } from "./SiteFooter";

const social = [{ label: "YouTube", href: "https://youtube.com/@x" }];

it("renders the newsletter slot and the four columns", () => {
  const { container } = render(<SiteFooter newsletter={<form aria-label="Newsletter signup" />} socialLinks={social} supportEmail="help@example.com" />);
  expect(container.querySelector("footer")).toHaveAttribute("id", "newsletter");
  expect(screen.getByRole("form", { name: "Newsletter signup" })).toBeVisible();
  for (const name of ["Games", "Studio", "Help", "Follow"]) {
    expect(screen.getByText(name, { selector: "h2, h3, p, span" })).toBeVisible();
  }
  expect(screen.getByRole("link", { name: "YouTube" })).toHaveAttribute("target", "_blank");
  expect(screen.getByRole("link", { name: "Player support" })).toHaveAttribute("href", "mailto:help@example.com");
});

it("does not link to a FAQ route", () => {
  render(<SiteFooter newsletter={null} socialLinks={[]} />);
  expect(screen.queryByRole("link", { name: "FAQ" })).toBeNull();
});

it("hides Follow without social links and Player support without an email", () => {
  render(<SiteFooter newsletter={null} socialLinks={[]} />);
  expect(screen.queryByText("Follow")).toBeNull();
  expect(screen.queryByRole("link", { name: "Player support" })).toBeNull();
});

it("compact variant has no columns", () => {
  render(<SiteFooter newsletter={null} socialLinks={social} variant="compact" />);
  expect(screen.queryByText("Studio", { selector: "h2, h3, p, span" })).toBeNull();
  expect(screen.getByRole("link", { name: "Privacy" })).toBeVisible();
});

it("Cookie settings asks the banner to reopen", async () => {
  const cb = vi.fn();
  window.addEventListener("io:consent-open", cb);
  render(<SiteFooter newsletter={null} socialLinks={[]} />);
  await userEvent.click(screen.getByRole("button", { name: "Cookie settings" }));
  expect(cb).toHaveBeenCalledOnce();
  window.removeEventListener("io:consent-open", cb);
});

it("has no circular Press kit link or press anchor until a global press kit exists", () => {
  const { container } = render(<SiteFooter newsletter={null} socialLinks={[]} />);
  expect(container.querySelector("#press")).toBeNull();
  expect(screen.queryByRole("link", { name: /press/i })).toBeNull();
  expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
  expect(screen.getByRole("link", { name: "News" })).toHaveAttribute("href", "/news");
  expect(screen.getByRole("link", { name: "Educational tools" })).toHaveAttribute("href", "/learn");
});

it("reserves room for the phone sticky play bar only when asked", () => {
  const { rerender } = render(<SiteFooter newsletter={null} socialLinks={[]} variant="compact" />);
  expect(screen.getByRole("contentinfo")).toHaveAttribute("data-sticky-bar", "false");
  rerender(<SiteFooter newsletter={null} socialLinks={[]} variant="compact" stickyBarSpace />);
  expect(screen.getByRole("contentinfo")).toHaveAttribute("data-sticky-bar", "true");
});
