import { expect, it } from "vitest";

// vitest.setup.ts strips the deploy env so `npm run build` (which runs the tests in prebuild) behaves
// the same on Vercel/CI as on a bare checkout.
it("runs with NODE_ENV=test and no app env vars, whatever the shell has", () => {
  expect(process.env.NODE_ENV).toBe("test");
  for (const name of ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY", "NEXT_PUBLIC_GTM_ID", "NEXT_PUBLIC_SANITY_PROJECT_ID", "NEXT_PUBLIC_SITE_URL", "NEXT_PHASE"]) {
    expect(process.env[name], name).toBeUndefined();
  }
});

it("package.json prebuild runs lint and the tests", async () => {
  const { readFileSync } = await import("node:fs");
  const path = await import("node:path");
  const pkg = JSON.parse(readFileSync(path.resolve(import.meta.dirname, "../../package.json"), "utf8")) as { scripts: Record<string, string> };
  expect(pkg.scripts.prebuild).toBe("node scripts/tokens-json.mjs && npm run lint && npm test");
});
