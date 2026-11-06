import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const scss = readFileSync(path.resolve(import.meta.dirname, "../../src/styles/tokens.scss"), "utf8");
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
tap-min icon-button control-height
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
});
