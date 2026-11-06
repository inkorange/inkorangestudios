import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Stack } from "./Stack";

it("renders as the requested element with data attributes", () => {
  render(<Stack as="ul" gap={4} direction="row" wrap align="center" justify="between"><li>a</li></Stack>);
  const el = screen.getByRole("list");
  expect(el).toHaveAttribute("data-direction", "row");
  expect(el).toHaveAttribute("data-gap", "4");
  expect(el).toHaveAttribute("data-wrap", "true");
});
it("defaults to a column div", () => {
  render(<Stack><i>a</i></Stack>);
  const el = screen.getByText("a").parentElement!;
  expect(el.tagName).toBe("DIV");
  expect(el).toHaveAttribute("data-direction", "column");
});
