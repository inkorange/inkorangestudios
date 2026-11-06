import type { ReactNode } from "react";
import styles from "./Grid.module.scss";

type Min = "tile" | "tile-s" | "card" | "rail" | "thumb";
type Gap = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 14 | 16;

export type GridProps = {
  min: Min;
  gap?: Gap;
  children: ReactNode;
};

export function Grid({ min, gap = 5, children }: GridProps) {
  return (
    <div className={styles.root} style={{ "--grid-min": `var(--grid-min-${min})`, "--grid-gap": `var(--space-${gap})` }} data-min={min} data-gap={gap}>
      {children}
    </div>
  );
}
