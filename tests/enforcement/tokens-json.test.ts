// @vitest-environment node
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildTokens, isStale } from "../../scripts/tokens-json.mjs";

type Token = { name: string; value: string; source: string; group: string };

const root = path.resolve(import.meta.dirname, "../..");
const scss = readFileSync(path.join(root, "src/styles/tokens.scss"), "utf8");
const defined = [...scss.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]);

describe("scripts/tokens-json.mjs", () => {
  const tokens: Token[] = buildTokens(path.join(root, "src/styles/tokens.scss")).tokens;
  const byName = new Map(tokens.map((t) => [t.name, t]));

  it("lists every token in tokens.scss once, in source order", () => {
    expect(tokens.map((t) => t.name)).toEqual([...new Set(defined)]);
  });

  it("keeps the raw value and the compiled value", () => {
    expect(byName.get("--color-accent")).toMatchObject({ value: "#E08D00", source: "#E08D00", group: "color" });
    expect(byName.get("--space-6")).toMatchObject({ value: "24px", group: "space" });
    const xl = byName.get("--text-display-xl")!;
    expect(xl.source).toBe("fluid(68, 112)");
    expect(xl.value).toMatch(/^clamp\(4\.25rem, .*vw.*, 7rem\)$/);
    expect(xl.group).toBe("text");
  });

  it("groups by prefix and ignores the reduced-motion overrides", () => {
    expect(byName.get("--duration-fast")).toMatchObject({ value: "120ms", group: "duration" });
    expect(byName.get("--z-banner")?.group).toBe("z");
    expect(byName.get("--grid-min-tile")?.group).toBe("grid");
  });

  it("matches the committed src/styles/tokens.json (run `node scripts/tokens-json.mjs`)", () => {
    const committed = JSON.parse(readFileSync(path.join(root, "src/styles/tokens.json"), "utf8"));
    expect(committed).toEqual(buildTokens(path.join(root, "src/styles/tokens.scss")));
  });

  it("isStale detects a tokens.json that no longer matches tokens.scss", () => {
    const scssPath = path.join(root, "src/styles/tokens.scss");
    const dir = mkdtempSync(path.join(tmpdir(), "tokens-"));
    const fresh = path.join(dir, "fresh.json");
    const stale = path.join(dir, "stale.json");
    const missing = path.join(dir, "missing.json");
    const built = buildTokens(scssPath);
    writeFileSync(fresh, `${JSON.stringify(built, null, 2)}\n`);
    writeFileSync(stale, `${JSON.stringify({ tokens: built.tokens.slice(1) }, null, 2)}\n`);
    expect(isStale(scssPath, fresh)).toBe(false);
    expect(isStale(scssPath, stale)).toBe(true);
    expect(isStale(scssPath, missing)).toBe(true);
  });

  it("`--check` exits 0 for the committed file without rewriting it", () => {
    const jsonPath = path.join(root, "src/styles/tokens.json");
    const before = readFileSync(jsonPath, "utf8");
    const run = spawnSync("node", ["scripts/tokens-json.mjs", "--check"], { cwd: root, encoding: "utf8" });
    expect(run.status).toBe(0);
    expect(readFileSync(jsonPath, "utf8")).toBe(before);
  });
});
