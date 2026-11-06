import { expect, it, vi } from "vitest";

vi.mock("./fonts", () => ({ display: { variable: "d" }, sans: { variable: "s" }, mono: { variable: "m" } }));
vi.mock("@/styles/globals.scss", () => ({}));

import { metadata } from "./layout";

it("describes the studio with its one-liner", () => {
  expect(metadata.title).toBe("inkOrange Studios");
  expect(metadata.description).toBe(
    "An independent studio making games that make you think. Sandboxes, puzzlers, simulations and more — for web, iOS and Android.",
  );
});
