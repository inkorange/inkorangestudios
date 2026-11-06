import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Chip } from "./Chip";

it("renders text with tone and size data attributes", () => {
  render(<Chip tone="accent" size="s">Out now</Chip>);
  const el = screen.getByText("Out now");
  expect(el).toHaveAttribute("data-tone", "accent");
  expect(el).toHaveAttribute("data-size", "s");
});

it("puts a decorative icon before the text", () => {
  const { container } = render(
    <Chip tone="outline" icon="android">
      Android
    </Chip>,
  );
  const chip = container.firstElementChild!;
  expect(chip).toHaveAttribute("data-icon", "true");
  expect(chip.firstElementChild?.tagName.toLowerCase()).toBe("svg");
  expect(chip.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  expect(chip).toHaveTextContent("Android");
});
