import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import SiteNotFound from "./not-found";

it("renders the 404 in main without a second logo (the site header has one)", () => {
  render(<SiteNotFound />);
  expect(screen.getByRole("main")).toContainElement(screen.getByRole("heading", { level: 1, name: "Lost in space" }));
  expect(screen.queryByRole("link", { name: "inkOrange Studios" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to games" })).toHaveAttribute("href", "/#games");
});
