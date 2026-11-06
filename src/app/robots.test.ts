// @vitest-environment node
import { expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ publicEnv: { siteUrl: "https://inkorangestudios.com" } }));

import robots from "./robots";

it("allows everything except the studio, the design gallery and the API, and points at the sitemap", () => {
  expect(robots()).toEqual({
    rules: { userAgent: "*", allow: "/", disallow: ["/studio", "/design", "/api"] },
    sitemap: "https://inkorangestudios.com/sitemap.xml",
  });
});
