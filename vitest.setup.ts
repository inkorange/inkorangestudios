import "@testing-library/jest-dom/vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/*
 * Hermetic env. `npm run build` runs the tests (prebuild), and on Vercel or CI
 * the process env holds the real keys (Turnstile, GTM, site URL…) and may hold
 * NODE_ENV=production, which would load React's production build and switch
 * features on. Tests start from what a bare checkout sees: every variable named
 * in .env.example unset, and NODE_ENV=test. Tests that need a value use vi.stubEnv.
 */
const example = readFileSync(path.resolve(import.meta.dirname, ".env.example"), "utf8");
for (const [, name] of example.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)) delete process.env[name];
delete process.env.NEXT_PHASE;
// NODE_ENV is typed read-only (Next declares it); assign through an index.
(process.env as Record<string, string | undefined>).NODE_ENV = "test";
