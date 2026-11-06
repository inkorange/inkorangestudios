import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

// Client components must not pull zod or the server env schema into the browser
// bundle. Public values come from src/lib/env-public.ts (zod-free); src/lib/env.ts
// re-exports them for server code.
const root = path.resolve(import.meta.dirname, "../..");
const src = path.join(root, "src");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

function resolve(from: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = path.join(src, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

// Value imports only: `import type` and `export type` are erased from the bundle.
const IMPORT = /^\s*(?:import|export)\s+(?!type\b)(?:[^"';]*?\sfrom\s+)?["']([^"']+)["']/gm;

function imports(file: string): string[] {
  return [...readFileSync(file, "utf8").matchAll(IMPORT)].map((m) => m[1]);
}

const directive = (file: string, name: string) => new RegExp(`^\\s*["']${name}["']`).test(readFileSync(file, "utf8"));
const isClient = (file: string) => directive(file, "use client");
// A "use server" module imported by a client component becomes an RPC reference; its code stays on the server.
const isServerAction = (file: string) => directive(file, "use server");

const serverEnv = path.join(src, "lib/env.ts");

it("no client component reaches zod or src/lib/env.ts", () => {
  const offenders: string[] = [];
  for (const entry of walk(src).filter(isClient)) {
    const seen = new Set<string>();
    const queue = [entry];
    while (queue.length) {
      const file = queue.pop()!;
      if (seen.has(file)) continue;
      seen.add(file);
      for (const spec of imports(file)) {
        if (spec === "zod" || spec.startsWith("zod/")) offenders.push(`${path.relative(root, entry)} → ${path.relative(root, file)} imports zod`);
        const next = resolve(file, spec);
        if (next === serverEnv) offenders.push(`${path.relative(root, entry)} → ${path.relative(root, file)} imports src/lib/env.ts`);
        if (next && !isServerAction(next)) queue.push(next);
      }
    }
  }
  expect(offenders).toEqual([]);
});

it("env-public.ts exists and is zod-free", () => {
  const file = path.join(src, "lib/env-public.ts");
  expect(existsSync(file)).toBe(true);
  expect(imports(file).filter((s) => s.startsWith("zod"))).toEqual([]);
});
