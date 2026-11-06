import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Button } from "./Button";

it("renders an anchor for an internal href", () => {
  render(<Button variant="ink" href="/about">About</Button>);
  expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
});
it("opens external links in a new tab safely", () => {
  render(<Button variant="accent" href="https://www.terraforgeworlds.com" external>Play</Button>);
  const a = screen.getByRole("link", { name: "Play" });
  expect(a).toHaveAttribute("target", "_blank");
  expect(a.getAttribute("rel")).toContain("noopener");
});
it("renders a button of type button by default and fires onClick", async () => {
  const onClick = vi.fn();
  render(<Button variant="outline" onClick={onClick} icon="globe" disabled={false}>Go</Button>);
  const b = screen.getByRole("button", { name: "Go" });
  expect(b).toHaveAttribute("type", "button");
  expect(b).toHaveAttribute("data-variant", "outline");
  await userEvent.click(b);
  expect(onClick).toHaveBeenCalledOnce();
});
it("disables only the button element", () => {
  render(<Button variant="ink" disabled>No</Button>);
  expect(screen.getByRole("button", { name: "No" })).toBeDisabled();
});
