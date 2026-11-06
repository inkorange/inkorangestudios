import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { UpdateRow } from "./UpdateRow";

it("renders a link with date and title", () => {
  render(<UpdateRow href="/news/x" date="2026-03-09" title="New exoplanet data" />);
  const link = screen.getByRole("link");
  expect(link).toHaveAttribute("href", "/news/x");
  expect(link).toHaveTextContent("MAR 9, 2026");
  expect(link).toHaveTextContent("New exoplanet data");
});
