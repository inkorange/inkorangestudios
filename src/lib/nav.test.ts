import { expect, it } from "vitest";
import { navStateForPath } from "./nav";

it.each([
  ["/", { active: "games", variant: "default" }],
  ["/games", { active: "games", variant: "default" }],
  ["/games/terraforge", { active: "games", variant: "game" }],
  ["/about", { active: "studio", variant: "default" }],
  ["/news", { active: "news", variant: "default" }],
  ["/news/a-post", { active: "news", variant: "default" }],
  ["/support", { active: "support", variant: "default" }],
  ["/privacy", { active: undefined, variant: "default" }],
  ["/newsletter-thing", { active: undefined, variant: "default" }],
  [null, { active: undefined, variant: "default" }],
])("%s → %o", (path, expected) => {
  expect(navStateForPath(path)).toEqual(expected);
});
