import { expect, it } from "vitest";
import { tokenPx, tokenValue } from "./tokens";

it("reads a token's compiled value from tokens.json", () => {
  expect(tokenValue("--color-paper")).toBe("#F6F1E7");
  expect(tokenValue("--color-accent")).toBe("#E08D00");
});

it("reads px sizes, using the desktop end of fluid sizes", () => {
  expect(tokenPx("--space-22")).toBe(88);
  expect(tokenPx("--logo-width-l")).toBe(220);
  expect(tokenPx("--text-display-xl")).toBe(112);
});

it("throws for unknown tokens and non-px values", () => {
  expect(() => tokenValue("--nope")).toThrow("Unknown token --nope");
  expect(() => tokenPx("--color-ink")).toThrow("--color-ink is not a px size");
});
