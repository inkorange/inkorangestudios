import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Placeholder } from "./Placeholder";

it("is aria-hidden without a label", () => {
  const { container } = render(<Placeholder ratio="3/4" />);
  expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  expect(container.firstElementChild).toHaveAttribute("data-ratio", "3/4");
});
it("exposes the label when given", () => {
  const { container } = render(<Placeholder tone="dark" label="Cover art" />);
  expect(screen.getByText("Cover art")).toBeVisible();
  expect(container.firstElementChild).not.toHaveAttribute("aria-hidden");
  expect(container.firstElementChild).toHaveAttribute("data-tone", "dark");
});
