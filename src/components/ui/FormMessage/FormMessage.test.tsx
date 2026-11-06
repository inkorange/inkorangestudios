import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { FormMessage } from "./FormMessage";

it("announces success as a status", () => {
  render(<FormMessage status="success">Thanks</FormMessage>);
  expect(screen.getByRole("status")).toHaveTextContent("Thanks");
});
it("announces errors as an alert", () => {
  render(<FormMessage status="error">Nope</FormMessage>);
  expect(screen.getByRole("alert")).toHaveTextContent("Nope");
});
