import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { FactList } from "./FactList";

it("renders dt/dd pairs", () => {
  const { container } = render(<FactList items={[{ label: "Platform", value: "Web" }, { label: "Genre", value: "Sandbox" }]} />);
  expect(container.querySelectorAll("dt")).toHaveLength(2);
  expect(container.querySelectorAll("dd")).toHaveLength(2);
  expect(screen.getByText("Platform").tagName).toBe("DT");
  expect(screen.getByText("Web").tagName).toBe("DD");
});
