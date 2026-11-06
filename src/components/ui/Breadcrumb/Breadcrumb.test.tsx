import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Breadcrumb } from "./Breadcrumb";

it("renders links and marks the last item as current", () => {
  render(<Breadcrumb items={[{ label: "Games", href: "/games" }, { label: "TerraForge" }]} />);
  expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Games" })).toHaveAttribute("href", "/games");
  expect(screen.getByText("TerraForge")).toHaveAttribute("aria-current", "page");
  expect(screen.queryByRole("link", { name: "TerraForge" })).not.toBeInTheDocument();
});
