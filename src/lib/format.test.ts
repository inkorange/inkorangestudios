import { expect, it } from "vitest";
import { formatDate } from "./format";

it("formats ISO dates as uppercase UTC", () => {
  expect(formatDate("2026-11-05")).toBe("NOV 5, 2026");
});
it("returns the input when it is not a date", () => {
  expect(formatDate("soon")).toBe("soon");
});
