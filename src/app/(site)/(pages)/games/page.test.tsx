import { expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("next/navigation", () => navigation);

import GamesIndex from "./page";

it("sends /games to the games section of the home page", () => {
  expect(() => GamesIndex()).toThrow("NEXT_REDIRECT");
  expect(navigation.redirect).toHaveBeenCalledWith("/#games");
});
