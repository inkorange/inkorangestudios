import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Display, Highlight } from "../Display/Display";
import { Statement } from "./Statement";

it("renders the display title and the body beside it", () => {
  render(
    <Statement
      title={
        <Display size="l">
          An independent studio making games that <Highlight paint>make you think.</Highlight>
        </Display>
      }
      body="Sandboxes and more."
    />,
  );
  expect(screen.getByRole("heading", { level: 2, name: "An independent studio making games that make you think." })).toBeInTheDocument();
  expect(screen.getByText("Sandboxes and more.")).toBeInTheDocument();
});
