import { readFileSync } from "node:fs";
import path from "node:path";
import * as sass from "sass";
import { describe, expect, it } from "vitest";

const stylesDir = path.resolve(import.meta.dirname, "../../src/styles");
const scss = readFileSync(path.join(stylesDir, "tokens.scss"), "utf8");
const compiled = sass.compile(path.join(stylesDir, "tokens.scss")).css;
const mixins = readFileSync(path.join(stylesDir, "_mixins.scss"), "utf8");
const globals = sass.compile(path.join(stylesDir, "globals.scss")).css;
const defined = new Set([...scss.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));

const required = `
color-paper color-card color-sand color-stripe color-line color-line-strong
color-ink color-ink-2 color-ink-3 color-ink-4 color-accent color-link
color-on-dark color-on-dark-2 color-on-dark-3 color-on-dark-4
color-dark-line color-dark-line-2 color-dark-line-3 color-dark-stripe color-dark-stripe-2
color-guide color-shadow
font-display font-sans font-mono
text-display-xl text-display-l text-display-m text-heading-l text-heading-m text-heading-s
text-title text-title-s text-lead text-body-l text-body text-body-s text-meta
text-mono text-mono-s text-mono-xs
weight-regular weight-medium weight-semibold weight-bold weight-black
leading-tight leading-snug leading-normal leading-body leading-loose
tracking-mono tracking-eyebrow tracking-wordmark
space-1 space-2 space-3 space-4 space-5 space-6 space-7 space-8 space-10 space-12
space-14 space-16 space-18 space-22 space-24
section-y gutter content-max
radius-xs radius-s radius-m radius-l radius-xl radius-2xl radius-3xl radius-pill
tap-min icon-button control-height focus-ring-width focus-ring-offset
duration-fast duration-base duration-slow duration-draw ease-standard ease-out
z-sticky z-header z-sheet z-banner
texture-watercolor
`.split(/\s+/).filter(Boolean).map((n) => `--${n}`);

describe("tokens.scss", () => {
  it.each(required)("defines %s", (name) => {
    expect(defined.has(name)).toBe(true);
  });

  it("accent is #E08D00", () => {
    expect(scss).toMatch(/--color-accent\s*:\s*#E08D00\s*;/i);
  });

  it("zeroes durations under reduced motion", () => {
    expect(scss).toMatch(/prefers-reduced-motion:\s*reduce/);
  });

  it("compiles, with fluid sizes as clamp()", () => {
    expect(compiled).toContain("clamp(");
  });

  it("emits fluid sizes in rem (keeps the vw slope) so text follows the user's font size", () => {
    const clamps = [...compiled.matchAll(/clamp\(([^;]*)\);/g)].map((m) => m[1]);
    expect(clamps.length).toBeGreaterThan(0);
    for (const args of clamps) {
      expect(args).not.toMatch(/px/);
      expect(args).toMatch(/rem/);
      expect(args).toMatch(/vw/);
    }
    // 15px → 17px body text: 0.9375rem min, 1.0625rem max.
    expect(compiled).toMatch(/--text-body:\s*clamp\(0\.9375rem,[^;]*,\s*1\.0625rem\);/);
  });

  it.each(["--duration-fast", "--duration-base", "--duration-slow", "--duration-draw"])(
    "sets %s to 0ms inside the compiled reduced-motion block",
    (name) => {
      const block = compiled.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/);
      expect(block).not.toBeNull();
      expect(block![1]).toMatch(new RegExp(`${name}:\\s*0ms;`));
    },
  );
});

describe("_mixins.scss", () => {
  it("focus-ring uses the focus-ring tokens", () => {
    expect(mixins).toMatch(/outline:\s*var\(--focus-ring-width\) solid/);
    expect(mixins).toMatch(/outline-offset:\s*var\(--focus-ring-offset\)/);
  });
});

describe("globals.scss", () => {
  it("wraps base link rules in :where() so component classes always win", () => {
    expect(globals).toMatch(/:where\(a\)\s*\{/);
    expect(globals).toMatch(/:where\(a\):hover\s*\{/);
    expect(globals).not.toMatch(/(^|\n|,\s*)a\s*\{/);
    expect(globals).not.toMatch(/(^|\n)a:hover/);
  });
});
