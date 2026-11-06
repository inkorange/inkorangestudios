import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const SEE = "(see DESIGN.md#enforcement)";

const rawColor = [
  {
    selector: "Literal[value=/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]",
    message: `No raw colors; use tokens ${SEE}.`,
  },
  { selector: "Literal[value=/^(rgb|hsl)a?\\(/]", message: `No raw colors; use tokens ${SEE}.` },
];

// Base selectors, defined once. A later flat-config block's no-restricted-syntax
// REPLACES the earlier one for matching files, so the pages block spreads these.
const baseSyntax = [
  {
    selector: "JSXAttribute[name.name='style'] Property > Identifier.key",
    message: `No inline styles. Use a component ${SEE}.`,
  },
  {
    selector: "JSXAttribute[name.name='style'] Property > Literal.key[value!=/^--/]",
    message: `Only CSS custom properties may be passed via style ${SEE}.`,
  },
  {
    selector: "JSXAttribute[name.name='style'] > JSXExpressionContainer > :not(ObjectExpression)",
    message: `No inline styles ${SEE}.`,
  },
];

const pageSyntax = [
  {
    selector: "JSXAttribute[name.name='className']",
    message: `Pages may not set className; use a component ${SEE}.`,
  },
  { selector: "JSXAttribute[name.name='style']", message: `Pages may not set style ${SEE}.` },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Not source we lint.
    "node_modules/**",
    ".superpowers/**",
    "docs/**",
    // Sanity's own UI.
    "sanity.config.ts",
    "src/app/studio/**",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    rules: { "no-restricted-syntax": ["error", ...baseSyntax] },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: { "no-restricted-syntax": ["error", ...baseSyntax, ...rawColor] },
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["*.scss*", "*.sass*", "*.css*"], message: `Pages compose components; they don't style ${SEE}.` },
          ],
        },
      ],
      "no-restricted-syntax": ["error", ...baseSyntax, ...rawColor, ...pageSyntax],
    },
  },
  {
    // Root layout: global stylesheet and font-variable classNames only.
    files: ["src/app/layout.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["*.scss*", "*.sass*", "*.css*", "!@/styles/globals.scss"],
              message: `Only @/styles/globals.scss may be imported here ${SEE}.`,
            },
          ],
        },
      ],
      "no-restricted-syntax": ["error", ...baseSyntax, ...rawColor, pageSyntax[1]],
    },
  },
]);

export default eslintConfig;
