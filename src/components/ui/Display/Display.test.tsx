import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Display, Highlight } from "./Display";

describe("Display", () => {
  it("renders the requested element with data-size", () => {
    render(<Display as="h1" size="xl">Terraforge</Display>);
    const h = screen.getByRole("heading", { level: 1, name: "Terraforge" });
    expect(h).toHaveAttribute("data-size", "xl");
  });
  it("defaults to h2", () => {
    render(<Display size="m">Hi</Display>);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });
  it("Highlight wraps text and flags paint", () => {
    render(<Display size="l">Games that <Highlight paint>make you think.</Highlight></Display>);
    expect(screen.getByText("make you think.")).toHaveAttribute("data-paint", "true");
  });
});
