import { tokenValue } from "@/lib/tokens";

/**
 * Email clients can't read CSS variables, so the colours and radii the email needs are resolved
 * here from the generated token file. This is the one place the email template gets its values.
 */
export const theme = {
  paper: tokenValue("--color-paper"),
  card: tokenValue("--color-card"),
  ink: tokenValue("--color-ink"),
  ink2: tokenValue("--color-ink-2"),
  ink3: tokenValue("--color-ink-3"),
  accent: tokenValue("--color-accent"),
  link: tokenValue("--color-link"),
  sand: tokenValue("--color-sand"),
  line: tokenValue("--color-line"),
  onDark: tokenValue("--color-on-dark"),
  onDark2: tokenValue("--color-on-dark-2"),
  onDark4: tokenValue("--color-on-dark-4"),
  darkLine: tokenValue("--color-dark-line"),
  radiusCard: tokenValue("--radius-xl"),
  radiusImage: tokenValue("--radius-m"),
  radiusPill: tokenValue("--radius-pill"),
  fontDisplay: "'Barlow Condensed','Arial Narrow',Arial,sans-serif",
  fontBody: "Inter,Arial,sans-serif",
  width: 600,
} as const;
