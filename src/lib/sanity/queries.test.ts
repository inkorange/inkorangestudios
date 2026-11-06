import { describe, expect, it } from "vitest";
import { FEATURED_QUERY, GAMES_QUERY, postsQuery } from "./queries";

describe("game ordering", () => {
  it("sorts unset sortOrder last", () => {
    expect(GAMES_QUERY).toContain("order(coalesce(sortOrder, 9999) asc, name asc)");
  });
  it("sorts unset featuredOrder last", () => {
    expect(FEATURED_QUERY).toContain("order(coalesce(featuredOrder, 9999) asc, name asc)");
  });
});

describe("postsQuery limit", () => {
  const q = (limit?: number) => postsQuery({ limit, filterByGame: false });
  it("applies a whole-number slice", () => {
    expect(q(3)).toContain("[0...3]");
    expect(q(3.9)).toContain("[0...3]");
  });
  it("omits the slice for non-finite, sub-1 or missing limits", () => {
    for (const l of [undefined, 0, -2, 0.5, NaN, Infinity]) expect(q(l)).not.toContain("[0...");
  });
});
