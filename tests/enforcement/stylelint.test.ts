// @vitest-environment node
import path from "node:path";
import stylelint from "stylelint";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "../..");
const configFile = path.join(root, "stylelint.config.mjs");

async function lint(code: string, file: string) {
  const result = await stylelint.lint({
    code,
    codeFilename: path.join(root, file),
    configFile,
    customSyntax: "postcss-scss",
  });
  return result.results[0].warnings;
}

const ui = "src/components/ui/X/X.module.scss";

describe("stylelint design-system rules", () => {
  it("rejects hex colors", async () => {
    const w = await lint(".a{color:#fff}", ui);
    expect(w.length).toBeGreaterThan(0);
  });
  it("rejects named colors", async () => {
    expect((await lint(".a{color:red}", ui)).length).toBeGreaterThan(0);
  });
  it("rejects rgb()/hsl()", async () => {
    expect((await lint(".a{border-color:rgb(0 0 0)}", ui)).length).toBeGreaterThan(0);
    expect((await lint(".a{border-color:hsla(0,0%,0%,.5)}", ui)).length).toBeGreaterThan(0);
  });
  it("rejects raw padding", async () => {
    const w = await lint(".a{padding:12px}", ui);
    expect(w.some((x) => x.rule.includes("declaration-strict-value"))).toBe(true);
  });
  it("rejects raw margin shorthand and font-size", async () => {
    expect((await lint(".a{margin:0 8px}", ui)).length).toBeGreaterThan(0);
    expect((await lint(".a{font-size:16px}", ui)).length).toBeGreaterThan(0);
  });
  it("accepts tokens", async () => {
    const w = await lint(".a {\n  border-radius: var(--radius-m);\n  color: var(--color-ink);\n  padding: 0 var(--space-3);\n  margin: auto;\n}\n", ui);
    expect(w).toEqual([]);
  });
  it("rejects Sass variables in components", async () => {
    const w = await lint("$x: 1px;", ui);
    expect(w.some((x) => x.rule === "scss/dollar-variable-pattern")).toBe(true);
  });
  it("allows Sass variables in _mixins.scss and tokens.scss", async () => {
    expect(await lint("$x: 1px;", "src/styles/_mixins.scss")).toEqual([]);
    expect(await lint("$x: 1px;", "src/styles/tokens.scss")).toEqual([]);
  });
  it("rejects @import", async () => {
    expect((await lint('@import "a";', ui)).length).toBeGreaterThan(0);
  });
  it("allows raw values in tokens.scss", async () => {
    expect(await lint(":root{--color-ink:#1C1A17}", "src/styles/tokens.scss")).toEqual([]);
  });
  it("still bans raw colors in globals.scss", async () => {
    expect((await lint("a{color:#fff}", "src/styles/globals.scss")).length).toBeGreaterThan(0);
  });
  it("error messages point to DESIGN.md#enforcement", async () => {
    const w = await lint(".a {\n  color: #fff;\n  padding: 12px;\n}\n", ui);
    expect(w.length).toBeGreaterThan(1);
    for (const x of w) expect(x.text).toContain("DESIGN.md#enforcement");
  });

  it("lints .module.css too", async () => {
    const css = "src/components/ui/X/X.module.css";
    expect((await lint(".a {\n  color: #fff;\n}\n", css)).length).toBeGreaterThan(0);
    expect((await lint(".a {\n  padding: 12px;\n}\n", css)).length).toBeGreaterThan(0);
  });
  it("rejects literal units inside functions", async () => {
    for (const d of ["padding: calc(12px * 2)", "margin: min(10px, 2vw)", "font-size: clamp(1rem, 2vw, 3rem)"]) {
      expect((await lint(`.a {\n  ${d};\n}\n`, ui)).length, d).toBeGreaterThan(0);
    }
  });
  it("accepts calc over tokens", async () => {
    expect(await lint(".a {\n  padding: calc(var(--space-4) * 2);\n}\n", ui)).toEqual([]);
  });
  it("rejects modern color functions in modules", async () => {
    expect((await lint(".a {\n  border-color: oklch(0.5 0.1 90);\n}\n", ui)).length).toBeGreaterThan(0);
    expect((await lint(".a {\n  border-color: color-mix(in srgb, red, blue);\n}\n", ui)).length).toBeGreaterThan(0);
  });
  it("allows color-mix and calc with units in tokens.scss", async () => {
    const code = ":root {\n  --x: color-mix(in srgb, #fff, #000);\n  --y: oklch(0.5 0.1 90);\n\n  padding: calc(12px * 2);\n}\n";
    expect(await lint(code, "src/styles/tokens.scss")).toEqual([]);
  });
  it("allows :global() in modules", async () => {
    expect(await lint(":global(.x) {\n  color: var(--color-ink);\n}\n", ui)).toEqual([]);
  });
});
