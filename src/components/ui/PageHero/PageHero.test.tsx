import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { PageHero } from "./PageHero";

it("renders eyebrow, h1 and intro", () => {
  render(<PageHero eyebrow="THE STUDIO" title="A title" intro="An intro." />);
  expect(screen.getByText("THE STUDIO")).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1, name: "A title" })).toBeInTheDocument();
  expect(screen.getByText("An intro.")).toBeInTheDocument();
});
it("hides a missing eyebrow and intro", () => {
  const { container } = render(<PageHero title="Only" />);
  expect(container.querySelectorAll("p")).toHaveLength(0);
});
