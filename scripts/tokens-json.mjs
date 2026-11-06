// Generates src/styles/tokens.json from src/styles/tokens.scss: every custom property in the
// first `:root` block, in source order, with its value as written ("source"), its compiled CSS
// value ("value") and a group taken from its name prefix (`--color-paper` -> "color").
// `prebuild` writes it; `pretest` and `pretypecheck` run with `--check`, which exits non-zero (and
// writes nothing) if the committed file is stale, so staleness can actually fail. Fix: run
// `node scripts/tokens-json.mjs` and commit the result.
// Consumers: the /design gallery (DesignGallery) and the OG image (which can't read CSS vars).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass";

const DECL = /(--[a-z0-9-]+)\s*:\s*([^;]+);/g;

/**
 * The body of the first `:root { … }` block (the reduced-motion overrides come later). It ends at
 * the first `}` on its own line, because `#{…}` interpolations inside it contain braces.
 */
function firstRoot(css) {
  const match = css.match(/:root\s*\{([\s\S]*?)\n\}/);
  if (!match) throw new Error("tokens.scss has no :root block");
  return match[1];
}

function sourceValue(raw) {
  const value = raw.replace(/\/\/.*$/, "").trim();
  const interpolated = value.match(/^#\{(.*)\}$/);
  return interpolated ? interpolated[1].trim() : value;
}

/** @param {string} scssPath */
export function buildTokens(scssPath) {
  const scss = readFileSync(scssPath, "utf8");
  const compiled = sass.compile(scssPath, { style: "expanded" }).css;

  const values = new Map([...firstRoot(compiled).matchAll(DECL)].map((m) => [m[1], m[2].trim()]));
  const sources = [...firstRoot(scss).matchAll(DECL)];

  const tokens = sources.map(([, name, raw]) => {
    const value = values.get(name);
    if (value === undefined) throw new Error(`${name} is missing from the compiled CSS`);
    return { name, value, source: sourceValue(raw), group: name.slice(2).split("-")[0] };
  });
  return { tokens };
}

function render(scssPath) {
  return `${JSON.stringify(buildTokens(scssPath), null, 2)}\n`;
}

/** True when the JSON file is missing or differs from what tokens.scss would generate. */
export function isStale(scssPath, jsonPath) {
  return !existsSync(jsonPath) || readFileSync(jsonPath, "utf8") !== render(scssPath);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const root = path.resolve(here, "..");
  const scssPath = path.join(root, "src/styles/tokens.scss");
  const out = path.join(root, "src/styles/tokens.json");
  const rel = path.relative(root, out);
  if (process.argv.includes("--check")) {
    if (isStale(scssPath, out)) {
      console.error(`tokens-json: ${rel} is stale. Run \`node scripts/tokens-json.mjs\` and commit it.`);
      process.exit(1);
    }
    console.log(`tokens-json: ${rel} is up to date`);
  } else {
    writeFileSync(out, render(scssPath));
    console.log(`tokens-json: wrote ${rel}`);
  }
}
