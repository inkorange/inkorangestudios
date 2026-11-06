import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Section } from "./Section";

it("sets tone and space data attributes", () => {
  render(<Section tone="ink" space="tight" aria-label="Featured" id="f">x</Section>);
  const s = screen.getByRole("region", { name: "Featured" });
  expect(s).toHaveAttribute("data-tone", "ink");
  expect(s).toHaveAttribute("data-space", "tight");
  expect(s).toHaveAttribute("id", "f");
});
it("defaults to paper/default", () => {
  render(<Section aria-label="A">x</Section>);
  expect(screen.getByRole("region")).toHaveAttribute("data-tone", "paper");
});
