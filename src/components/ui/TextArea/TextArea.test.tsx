import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { TextArea } from "./TextArea";

it("labels the textarea and sets rows", () => {
  render(<TextArea label="Message" name="message" rows={6} required />);
  const t = screen.getByRole("textbox", { name: "Message" });
  expect(t).toHaveAttribute("rows", "6");
  expect(t).toBeRequired();
});
it("links an error to the textarea", () => {
  render(<TextArea label="Message" name="message" error="Too short" />);
  const t = screen.getByRole("textbox", { name: "Message" });
  expect(t).toHaveAttribute("aria-invalid", "true");
  expect(t).toHaveAccessibleDescription("Too short");
});
