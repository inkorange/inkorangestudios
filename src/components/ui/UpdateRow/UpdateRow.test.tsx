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

it("links out in a new tab and names the publication", () => {
  render(<UpdateRow href="https://example.com/a" date="2026-10-28" title="About us" source="Example Gazette" />);
  const link = screen.getByRole("link");
  expect(link).toHaveAttribute("href", "https://example.com/a");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
  expect(link).toHaveTextContent("EXAMPLE GAZETTE");
  expect(link).toHaveAccessibleName(expect.stringContaining("(opens in a new tab)"));
});
