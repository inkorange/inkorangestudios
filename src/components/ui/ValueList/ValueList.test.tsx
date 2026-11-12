import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ValueList } from "./ValueList";

it("renders each value with title and body", () => {
  render(<ValueList items={[{ title: "Play first", body: "Fun fast." }, { title: "Play anywhere", body: "Web." }]} />);
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getByText("Play first")).toBeVisible();
  expect(screen.getByText("Web.")).toBeVisible();
});

it("takes a stacked phone layout for longer copy", () => {
  const { container, rerender } = render(<ValueList items={[{ title: "A", body: "b" }]} />);
  expect(container.querySelector("ul")).toHaveAttribute("data-phone", "row");
  rerender(<ValueList items={[{ title: "A", body: "b" }]} phone="stack" />);
  expect(container.querySelector("ul")).toHaveAttribute("data-phone", "stack");
});
