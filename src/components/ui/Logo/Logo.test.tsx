import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import { Logo } from "./Logo";

it("renders the logo image with alt text", () => {
  render(<Logo />);
  const img = screen.getByAltText("inkOrange Studios");
  expect(img).toBeInTheDocument();
  expect(screen.queryByRole("link")).toBeNull();
});
it("wraps in a link when href is given", () => {
  render(<Logo href="/" />);
  expect(screen.getByRole("link", { name: "inkOrange Studios" })).toHaveAttribute("href", "/");
});
it("flags animate", () => {
  render(<Logo animate size="l" />);
  const img = screen.getByAltText("inkOrange Studios");
  expect(img.parentElement).toHaveAttribute("data-animate", "true");
  expect(img.parentElement).toHaveAttribute("data-size", "l");
});
