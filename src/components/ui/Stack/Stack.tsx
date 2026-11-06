import type { ReactNode } from "react";
import styles from "./Stack.module.scss";

export type SpaceStep = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 14 | 16;

export type StackProps = {
  gap?: SpaceStep;
  direction?: "column" | "row";
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "between";
  wrap?: boolean;
  as?: "div" | "ul" | "ol" | "li" | "nav" | "header" | "footer" | "span";
  children: ReactNode;
};

export function Stack({ gap = 4, direction = "column", align, justify, wrap = false, as: Tag = "div", children }: StackProps) {
  return (
    <Tag
      className={styles.root}
      style={{ "--stack-gap": `var(--space-${gap})` }}
      data-gap={gap}
      role={Tag === "ul" || Tag === "ol" ? "list" : undefined}
      data-direction={direction}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap}
    >
      {children}
    </Tag>
  );
}
