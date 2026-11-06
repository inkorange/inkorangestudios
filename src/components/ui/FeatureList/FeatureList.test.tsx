import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { FeatureList } from "./FeatureList";

it("numbers items 01, 02", () => {
  render(<FeatureList items={[{ title: "A", body: "a body" }, { title: "B", body: "b body" }]} />);
  expect(screen.getByText("01")).toBeVisible();
  expect(screen.getByText("02")).toBeVisible();
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getByRole("heading", { level: 3, name: "A" })).toBeVisible();
});
