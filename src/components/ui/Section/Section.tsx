import type { ReactNode } from "react";
import styles from "./Section.module.scss";

export type SectionProps = {
  tone?: "paper" | "sand" | "ink";
  space?: "default" | "tight" | "none";
  id?: string;
  "aria-label"?: string;
  children: ReactNode;
};

export function Section({ tone = "paper", space = "default", id, "aria-label": ariaLabel, children }: SectionProps) {
  return (
    <section className={styles.root} data-tone={tone} data-space={space} id={id} aria-label={ariaLabel}>
      {children}
    </section>
  );
}
