import type { ReactNode } from "react";
import styles from "./Display.module.scss";

export type DisplayProps = {
  as?: "h1" | "h2";
  size: "xl" | "l" | "m";
  tone?: "ink" | "on-dark";
  children: ReactNode;
};

export function Display({ as: Tag = "h2", size, tone = "ink", children }: DisplayProps) {
  return (
    <Tag className={styles.root} data-size={size} data-tone={tone}>
      {children}
    </Tag>
  );
}

export type HighlightProps = {
  children: ReactNode;
  /** Layer the watercolor wash over the accent. */
  paint?: boolean;
};

/** The one accent-highlighted phrase inside a Display ("make you think."). */
export function Highlight({ children, paint = false }: HighlightProps) {
  return (
    <span className={styles.highlight} data-paint={paint}>
      {children}
    </span>
  );
}
