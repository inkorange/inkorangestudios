import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Prose } from "./Prose";

const body = [{ _type: "block", _key: "a", style: "normal", markDefs: [], children: [{ _type: "span", _key: "s", text: "Hello body", marks: [] }] }];

it("renders title, meta and body", () => {
  render(<Prose title="Terms of use" meta="Last updated Nov 5, 2026" body={body} />);
  expect(screen.getByRole("heading", { level: 1, name: "Terms of use" })).toBeInTheDocument();
  expect(screen.getByText("Last updated Nov 5, 2026")).toBeInTheDocument();
  expect(screen.getByText("Hello body")).toBeInTheDocument();
});
it("omits meta when absent", () => {
  render(<Prose title="T" body={body} />);
  expect(screen.queryByText(/Last updated/)).toBeNull();
});
