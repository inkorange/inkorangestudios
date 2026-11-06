import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Chip } from "./Chip";

it("renders text with tone and size data attributes", () => {
  render(<Chip tone="accent" size="s">Out now</Chip>);
  const el = screen.getByText("Out now");
  expect(el).toHaveAttribute("data-tone", "accent");
  expect(el).toHaveAttribute("data-size", "s");
});
