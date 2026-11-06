import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ValueList } from "./ValueList";

it("renders each value with title and body", () => {
  render(<ValueList items={[{ title: "Play first", body: "Fun fast." }, { title: "Play anywhere", body: "Web." }]} />);
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getByText("Play first")).toBeVisible();
  expect(screen.getByText("Web.")).toBeVisible();
});
