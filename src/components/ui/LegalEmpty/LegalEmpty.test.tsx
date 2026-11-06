import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { LegalEmpty } from "./LegalEmpty";

it("shows the title as the page heading and a calm note", () => {
  render(<LegalEmpty title="Privacy policy" />);
  expect(screen.getByRole("heading", { level: 1, name: "Privacy policy" })).toBeInTheDocument();
  expect(screen.getByText("This page is being written.")).toBeInTheDocument();
});
