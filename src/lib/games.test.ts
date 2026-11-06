import { expect, it } from "vitest";
import { statusLabel } from "./games";

it("labels statuses in full and short form", () => {
  expect(statusLabel("out-now")).toBe("OUT NOW");
  expect(statusLabel("coming-soon")).toBe("COMING SOON");
  expect(statusLabel("in-development")).toBe("IN DEVELOPMENT");
  expect(statusLabel("announcing-soon")).toBe("ANNOUNCING SOON");
  expect(statusLabel("in-development", true)).toBe("IN DEV");
  expect(statusLabel("coming-soon", true)).toBe("SOON");
  expect(statusLabel("announcing-soon", true)).toBe("TBA");
});
