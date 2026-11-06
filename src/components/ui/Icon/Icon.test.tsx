import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { Icon } from "./Icon";

it("renders a decorative svg at the given size", () => {
  const { container } = render(<Icon name="play" size={34} />);
  const svg = container.querySelector("svg")!;
  expect(svg).toHaveAttribute("aria-hidden", "true");
  expect(svg).toHaveAttribute("width", "34");
});
