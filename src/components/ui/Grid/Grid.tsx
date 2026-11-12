import type { ReactNode } from "react";
import type { SpaceStep } from "../Stack/Stack";
import styles from "./Grid.module.scss";

type Min = "tile" | "tile-s" | "card" | "rail" | "thumb" | "tool";

export type GridProps = {
  min: Min;
  gap?: SpaceStep;
  children: ReactNode;
};

export function Grid({ min, gap = 5, children }: GridProps) {
  return (
    <div className={styles.root} style={{ "--grid-min": `var(--grid-min-${min})`, "--grid-gap": `var(--space-${gap})` }} data-min={min} data-gap={gap}>
      {children}
    </div>
  );
}
