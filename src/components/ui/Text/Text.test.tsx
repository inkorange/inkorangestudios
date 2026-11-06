import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Text } from "./Text";

it("defaults to a paragraph", () => {
  render(<Text>Hello</Text>);
  expect(screen.getByText("Hello").tagName).toBe("P");
});
it("supports as, size, tone and weight", () => {
  render(<Text as="span" size="meta" tone="ink-3" weight="medium">x</Text>);
  const el = screen.getByText("x");
  expect(el.tagName).toBe("SPAN");
  expect(el).toHaveAttribute("data-size", "meta");
  expect(el).toHaveAttribute("data-tone", "ink-3");
  expect(el).toHaveAttribute("data-weight", "medium");
});
