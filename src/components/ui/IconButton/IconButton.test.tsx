import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { IconButton } from "./IconButton";

it("exposes its label as the accessible name", async () => {
  const onClick = vi.fn();
  render(<IconButton icon="menu" label="Open menu" aria-expanded={false} aria-controls="sheet" onClick={onClick} />);
  const b = screen.getByRole("button", { name: "Open menu" });
  expect(b).toHaveAttribute("aria-expanded", "false");
  expect(b).toHaveAttribute("aria-controls", "sheet");
  await userEvent.click(b);
  expect(onClick).toHaveBeenCalledOnce();
});
