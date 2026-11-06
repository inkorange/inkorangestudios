import "react";

// Lets components pass runtime values to their own SCSS: style={{ "--gap": "…" }}.
// ESLint only allows style objects whose keys are all custom properties.
declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
