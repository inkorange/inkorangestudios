import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import NotFound, { metadata } from "./not-found";

it("is a friendly 404 with a way back to the games", () => {
  render(<NotFound />);
  expect(screen.getByRole("main")).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1, name: "Lost in space" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to games" })).toHaveAttribute("href", "/#games");
  expect(screen.getByRole("link", { name: "inkOrange Studios" })).toHaveAttribute("href", "/");
  expect(metadata.title).toBe("Page not found — inkOrange Studios");
});
