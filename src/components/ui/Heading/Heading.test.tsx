import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Heading } from "./Heading";

it("renders the level and size", () => {
  render(<Heading as="h3" size="title-s">News</Heading>);
  expect(screen.getByRole("heading", { level: 3, name: "News" })).toHaveAttribute("data-size", "title-s");
});
