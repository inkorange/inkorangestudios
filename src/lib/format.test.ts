import { expect, it } from "vitest";
import { formatDate } from "./format";

it("formats ISO dates as uppercase UTC", () => {
  expect(formatDate("2026-11-05")).toBe("NOV 5, 2026");
});
it("formats in sentence case on request, still in UTC", () => {
  expect(formatDate("2026-11-05T23:30:00Z", { case: "title" })).toBe("Nov 5, 2026");
  expect(formatDate("2026-11-05", { case: "upper" })).toBe("NOV 5, 2026");
});
it("returns the input when it is not a date", () => {
  expect(formatDate("soon")).toBe("soon");
  expect(formatDate("soon", { case: "title" })).toBe("soon");
});
