// Design-system enforcement for SCSS. Rules and exemptions are documented in
// DESIGN.md#enforcement; keep the two in step.
const see = " (see DESIGN.md#enforcement)";
const msg = (text) => ({ message: `${text}${see}` });

const config = {
  extends: ["stylelint-config-standard-scss"],
  plugins: ["stylelint-declaration-strict-value"],
  rules: {
    "color-no-hex": [true, msg("No raw hex colors. Use a color token, e.g. var(--color-ink)")],
    "color-named": ["never", msg("No named colors. Use a color token")],
    "function-disallowed-list": [
      ["rgb", "rgba", "hsl", "hsla"],
      msg("No raw color functions. Use a color token"),
    ],
    "scale-unlimited/declaration-strict-value": [
      [
        "/color$/", "fill", "stroke", "background", "background-color", "font-size", "font-family",
        "font-weight", "line-height", "letter-spacing", "border-radius", "gap", "row-gap", "column-gap",
        "/^margin/", "/^padding/", "box-shadow", "z-index", "transition-duration", "animation-duration",
      ],
      {
        ignoreValues: ["0", "auto", "inherit", "initial", "unset", "none", "transparent", "currentColor", "100%"],
        expandShorthand: true,
        disableFix: true,
        message: `Use a design token via var(--…) for "\${property}", not "\${value}"${see}`,
      },
    ],
    // Sass $variables are banned outside tokens.scss and _mixins.scss (overrides below).
    "scss/dollar-variable-pattern": ["^_never_$", msg("No Sass variables. Use CSS variables from tokens.scss")],
    "at-rule-disallowed-list": [["import"], msg("Use @use, not @import")],
  },
  overrides: [
    {
      files: ["src/styles/tokens.scss"],
      rules: {
        "color-no-hex": null,
        "function-disallowed-list": null,
        "scale-unlimited/declaration-strict-value": null,
        "scss/dollar-variable-pattern": null,
        // Raw color notation and font-family names are tokens' business.
        "color-function-notation": null,
        "color-function-alias-notation": null,
        "alpha-value-notation": null,
        "value-keyword-case": null,
      },
    },
    {
      files: ["src/styles/_mixins.scss"],
      rules: { "scss/dollar-variable-pattern": null },
    },
  ],
};

export default config;
