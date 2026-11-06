import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Container } from "./Container";

it("defaults to content width, supports narrow", () => {
  render(<><Container><i>a</i></Container><Container width="narrow"><i>b</i></Container></>);
  expect(screen.getByText("a").parentElement).toHaveAttribute("data-width", "content");
  expect(screen.getByText("b").parentElement).toHaveAttribute("data-width", "narrow");
});
