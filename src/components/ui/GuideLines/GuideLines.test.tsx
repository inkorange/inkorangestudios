import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { GuideLines } from "./GuideLines";

it("renders children and an aria-hidden lines layer", () => {
  const { container } = render(<GuideLines><p>Hello</p></GuideLines>);
  expect(screen.getByText("Hello")).toBeInTheDocument();
  expect(container.querySelector("[data-guides]")).toHaveAttribute("aria-hidden", "true");
});
