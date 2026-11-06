import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { FilterPills } from "./FilterPills";

const options = ["All", "Out now", "Coming soon"] as const;

it("marks the current option pressed and reports changes", async () => {
  const onChange = vi.fn();
  render(<FilterPills options={options} value="All" onChange={onChange} label="Filter games" />);
  expect(screen.getByRole("group", { name: "Filter games" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Out now" })).toHaveAttribute("aria-pressed", "false");
  await userEvent.click(screen.getByRole("button", { name: "Out now" }));
  expect(onChange).toHaveBeenCalledWith("Out now");
});
