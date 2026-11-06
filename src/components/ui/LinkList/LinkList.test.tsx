import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { LinkList } from "./LinkList";

it("renders a list of links", () => {
  render(<LinkList label="Game help" items={[{ label: "TerraForge", href: "/games/terraforge" }]} />);
  const list = screen.getByRole("list", { name: "Game help" });
  expect(list).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "TerraForge" })).toHaveAttribute("href", "/games/terraforge");
});
it("renders nothing without items", () => {
  const { container } = render(<LinkList label="x" items={[]} />);
  expect(container).toBeEmptyDOMElement();
});
