import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { Honeypot } from "./Honeypot";

it("renders an aria-hidden, untabbable, autocomplete-off input", () => {
  const { container } = render(<Honeypot />);
  const input = container.querySelector("input")!;
  expect(input).toHaveAttribute("name", "website");
  expect(input).toHaveAttribute("tabindex", "-1");
  expect(input).toHaveAttribute("autocomplete", "off");
  expect(input.closest('[aria-hidden="true"]')).not.toBeNull();
});
