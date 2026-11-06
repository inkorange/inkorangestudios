import type { ReactNode } from "react";
import styles from "./Eyebrow.module.scss";

export type EyebrowProps = {
  tone?: "ink-3" | "link" | "on-dark-4" | "on-accent";
  children: ReactNode;
};

export function Eyebrow({ tone = "ink-3", children }: EyebrowProps) {
  return (
    <p className={styles.root} data-tone={tone}>
      {children}
    </p>
  );
}
