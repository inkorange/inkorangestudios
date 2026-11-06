import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { SectionHeader } from "./SectionHeader";

it("renders the title as an h2 by default with an action link", () => {
  render(<SectionHeader title="News" action={{ label: "All news →", href: "/news" }} />);
  expect(screen.getByRole("heading", { level: 2, name: "News" })).toBeVisible();
  expect(screen.getByRole("link", { name: "All news →" })).toHaveAttribute("href", "/news");
});
it("supports h1, size and no rule, plus children", () => {
  const { container } = render(
    <SectionHeader title="Games" as="h1" size="m" rule={false}>
      <button type="button">Filter</button>
    </SectionHeader>,
  );
  expect(screen.getByRole("heading", { level: 1 })).toBeVisible();
  expect(screen.getByRole("button", { name: "Filter" })).toBeVisible();
  expect(container.firstElementChild).toHaveAttribute("data-rule", "false");
  expect(container.firstElementChild).toHaveAttribute("data-size", "m");
});
