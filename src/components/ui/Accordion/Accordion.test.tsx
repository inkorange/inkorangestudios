import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Accordion } from "./Accordion";

it("toggles open when the summary is clicked", () => {
  const { container } = render(<Accordion title="Details">Body copy</Accordion>);
  const details = container.querySelector("details");
  expect(details).not.toHaveAttribute("open");
  fireEvent.click(screen.getByText("Details"));
  // jsdom implements details toggling on summary activation
  expect(details).toHaveAttribute("open");
});
it("can start open", () => {
  const { container } = render(<Accordion title="T" defaultOpen>Body</Accordion>);
  expect(container.querySelector("details")).toHaveAttribute("open");
});
