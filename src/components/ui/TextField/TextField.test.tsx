import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { TextField } from "./TextField";

it("keeps an accessible name when the label is hidden", () => {
  render(<TextField label="Email address" hideLabel name="email" type="email" />);
  const input = screen.getByRole("textbox", { name: "Email address" });
  expect(input).toHaveAttribute("name", "email");
  expect(input).toHaveAttribute("type", "email");
});
it("links an error to the input", () => {
  render(<TextField label="Email" name="email" error="Enter a valid email" />);
  const input = screen.getByRole("textbox", { name: "Email" });
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAccessibleDescription("Enter a valid email");
});
it("has no invalid state without an error", () => {
  render(<TextField label="Email" name="email" required />);
  const input = screen.getByRole("textbox", { name: "Email" });
  expect(input).not.toHaveAttribute("aria-invalid");
  expect(input).toBeRequired();
});
