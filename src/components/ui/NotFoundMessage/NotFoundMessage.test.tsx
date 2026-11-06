import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import { NotFoundMessage } from "./NotFoundMessage";

it("says the page is lost and links back to the games", () => {
  render(<NotFoundMessage />);
  expect(screen.getByRole("heading", { level: 1, name: "Lost in space" })).toBeInTheDocument();
  expect(screen.getByText(/couldn.t find that page/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to games" })).toHaveAttribute("href", "/#games");
  expect(screen.queryByRole("link", { name: "inkOrange Studios" })).not.toBeInTheDocument();
});

it("adds the logo linking home when there is no site header", () => {
  render(<NotFoundMessage logo />);
  expect(screen.getByRole("link", { name: "inkOrange Studios" })).toHaveAttribute("href", "/");
});

it("takes a custom title, message and action (the error page)", () => {
  render(<NotFoundMessage title="Something went wrong" message="Try again soon." action={<button type="button">Try again</button>} />);
  expect(screen.getByRole("heading", { level: 1, name: "Something went wrong" })).toBeInTheDocument();
  expect(screen.getByText("Try again soon.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Back to games" })).toBeNull();
});
