import type { ReactNode } from "react";
import styles from "./GuideLines.module.scss";

export type GuideLinesProps = {
  children: ReactNode;
};

/** Decorative sketch-stage construction lines behind its children. */
export function GuideLines({ children }: GuideLinesProps) {
  return (
    <div className={styles.root}>
      <span className={styles.lines} data-guides aria-hidden="true" />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
