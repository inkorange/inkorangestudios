import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Eyebrow } from "./Eyebrow";

it("supports the on-accent tone", () => {
  render(<Eyebrow tone="on-accent">Now recruiting</Eyebrow>);
  expect(screen.getByText("Now recruiting")).toHaveAttribute("data-tone", "on-accent");
});

it("renders text with tone", () => {
  render(<Eyebrow tone="link">The studio</Eyebrow>);
  expect(screen.getByText("The studio")).toHaveAttribute("data-tone", "link");
});
