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

it("supports top-only and bottom-only spacing", () => {
  render(
    <>
      <Section aria-label="T" space="top">x</Section>
      <Section aria-label="B" space="bottom">y</Section>
    </>,
  );
  expect(screen.getByRole("region", { name: "T" })).toHaveAttribute("data-space", "top");
  expect(screen.getByRole("region", { name: "B" })).toHaveAttribute("data-space", "bottom");
});
