import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Eyebrow } from "./Eyebrow";

it("renders text with tone", () => {
  render(<Eyebrow tone="link">The studio</Eyebrow>);
  expect(screen.getByText("The studio")).toHaveAttribute("data-tone", "link");
});
