// @vitest-environment node
import path from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const cwd = path.resolve(import.meta.dirname, "../..");
const eslint = new ESLint({ cwd });

async function lint(code: string, file: string) {
  const [r] = await eslint.lintText(code, { filePath: path.join(cwd, file) });
  return r.messages.filter((m) => m.severity === 2);
}

const ui = "src/components/ui/X/X.tsx";

describe("eslint design-system rules", () => {
  it("rejects inline style with real properties", async () => {
    expect((await lint('export const A = () => <div style={{color:"red"}}/>;', ui)).length).toBeGreaterThan(0);
  });
  it("rejects non-object style values", async () => {
    expect((await lint("export const A = (p: {s: object}) => <div style={p.s}/>;", ui)).length).toBeGreaterThan(0);
  });
  it("allows custom-property-only style in components", async () => {
    expect(await lint('export const A = () => <div style={{"--progress":"40%"}}/>;', ui)).toEqual([]);
  });
  it("rejects className in pages", async () => {
    expect((await lint('export default function P() { return <p className="x"/>; }', "src/app/about/page.tsx")).length).toBeGreaterThan(0);
  });
  it("rejects style in pages, even custom properties", async () => {
    expect((await lint('export default function P() { return <p style={{"--a":"1"}}/>; }', "src/app/about/page.tsx")).length).toBeGreaterThan(0);
  });
  it("rejects scss imports in pages", async () => {
    expect((await lint('import s from "./a.module.scss";\nexport const x = s;', "src/app/page.tsx")).length).toBeGreaterThan(0);
  });
  it("rejects raw color literals in src", async () => {
    expect((await lint('export const c = "#E08D00";', "src/lib/x.ts")).length).toBeGreaterThan(0);
    expect((await lint('export const c = "rgb(0,0,0)";', "src/lib/x.ts")).length).toBeGreaterThan(0);
  });
  it("exempts test files and tests/", async () => {
    expect(await lint('export const c = "#E08D00";', "src/lib/x.test.ts")).toEqual([]);
    expect(await lint('export const c = "#E08D00";', "tests/enforcement/x.test.ts")).toEqual([]);
  });
  it("allows globals.scss import and className in layout.tsx", async () => {
    const code = 'import "@/styles/globals.scss";\nexport default function L() { return <html className="a"/>; }';
    expect(await lint(code, "src/app/layout.tsx")).toEqual([]);
  });
  it("layout.tsx may not import other scss or use style", async () => {
    expect((await lint('import "./x.scss";\nexport const a = 1;', "src/app/layout.tsx")).length).toBeGreaterThan(0);
    expect((await lint('import "@/styles/other.scss";\nexport const a = 1;', "src/app/layout.tsx")).length).toBeGreaterThan(0);
    expect((await lint('export default function L() { return <html style={{"--a":"1"}}/>; }', "src/app/layout.tsx")).length).toBeGreaterThan(0);
  });
  it("ignores src/app/studio and sanity.config.ts", async () => {
    expect(await lint('export default function S() { return <p className="x" style={{color:"red"}}/>; }', "src/app/studio/[[...tool]]/page.tsx")).toEqual([]);
  });
});
