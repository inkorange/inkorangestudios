import type { ReactNode } from "react";
import styles from "./Text.module.scss";

export type TextProps = {
  as?: "p" | "span" | "div";
  size?: "lead" | "body-l" | "body" | "body-s" | "meta";
  tone?: "ink" | "ink-2" | "ink-3" | "on-dark" | "on-dark-2" | "on-dark-3";
  weight?: "regular" | "medium" | "semibold";
  children: ReactNode;
};

export function Text({ as: Tag = "p", size = "body", tone, weight, children }: TextProps) {
  return (
    <Tag className={styles.root} data-size={size} data-tone={tone} data-weight={weight}>
      {children}
    </Tag>
  );
}
