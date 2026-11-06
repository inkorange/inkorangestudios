import type { ReactNode } from "react";
import styles from "./Chip.module.scss";

export type ChipProps = {
  tone: "accent" | "ink" | "outline" | "outline-on-dark" | "plain-on-dark";
  size?: "s" | "m";
  children: ReactNode;
};

export function Chip({ tone, size = "m", children }: ChipProps) {
  return (
    <span className={styles.root} data-tone={tone} data-size={size}>
      {children}
    </span>
  );
}
