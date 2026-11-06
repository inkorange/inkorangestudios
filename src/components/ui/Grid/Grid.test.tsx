import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Grid } from "./Grid";

it("exposes min and gap", () => {
  render(<Grid min="card" gap={6}><i>a</i></Grid>);
  const el = screen.getByText("a").parentElement!;
  expect(el).toHaveAttribute("data-min", "card");
  expect(el).toHaveAttribute("data-gap", "6");
});
