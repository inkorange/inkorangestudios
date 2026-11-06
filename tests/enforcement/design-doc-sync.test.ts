import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Keeps DESIGN.md honest: every token and every ui component is documented,
// and the doc names no token that doesn't exist.
const root = path.resolve(import.meta.dirname, "../..");
const designPath = path.join(root, "DESIGN.md");
const tokensPath = path.join(root, "src/styles/tokens.scss");
const uiDir = path.join(root, "src/components/ui");

const design = existsSync(designPath) ? readFileSync(designPath, "utf8") : "";
const tokens = readFileSync(tokensPath, "utf8");

// A token is "defined" when it appears as `--name:` in tokens.scss.
const defined = new Set([...tokens.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
// A token is "documented" when DESIGN.md has it alone inside backticks: `--name`.
const documented = new Set([...design.matchAll(/`(--[a-z0-9-]+)`/g)].map((m) => m[1]));

const uiFolders = existsSync(uiDir)
  ? readdirSync(uiDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  : [];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sections = [
  "Principles",
  "Brand motif",
  "Color",
  "Typography",
  "Spacing & layout",
  "Radius",
  "Motion",
  "Layers",
  "Components",
  "Page composition",
  "Accessibility",
  "Enforcement",
  "Adding a token or component",
];

describe("DESIGN.md", () => {
  it("exists at the repo root", () => {
    expect(existsSync(designPath)).toBe(true);
  });

  it.each(sections)("has a ## %s section", (title) => {
    expect(design).toMatch(new RegExp(`^## ${escape(title)}\\s*$`, "m"));
  });

  it("documents every token defined in tokens.scss", () => {
    const missing = [...defined].filter((t) => !documented.has(t)).sort();
    expect(missing).toEqual([]);
  });

  it("documents no token that tokens.scss does not define", () => {
    const unknown = [...documented].filter((t) => !defined.has(t)).sort();
    expect(unknown).toEqual([]);
  });

  it("has a ### heading for every folder in src/components/ui", () => {
    const missing = uiFolders.filter(
      (name) => !new RegExp(`^### ${escape(name)}\\s*$`, "m").test(design),
    );
    expect(missing).toEqual([]);
  });
});
