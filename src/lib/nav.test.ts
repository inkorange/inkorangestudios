import { expect, it } from "vitest";
import { navStateForPath } from "./nav";

it.each([
  ["/", { active: "games", current: "true", variant: "default" }],
  ["/games", { active: "games", current: "page", variant: "default" }],
  ["/games/terraforge", { active: "games", current: "true", variant: "game" }],
  ["/about", { active: "studio", current: "page", variant: "default" }],
  ["/news", { active: "news", current: "page", variant: "default" }],
  ["/news/a-post", { active: "news", current: "true", variant: "default" }],
  ["/press", { active: "press", current: "page", variant: "default" }],
  ["/support", { active: "support", current: "page", variant: "default" }],
  ["/privacy", { active: undefined, current: "page", variant: "default" }],
  ["/newsletter-thing", { active: undefined, current: "page", variant: "default" }],
  [null, { active: undefined, current: "page", variant: "default" }],
])("%s → %o", (path, expected) => {
  expect(navStateForPath(path)).toEqual(expected);
});
