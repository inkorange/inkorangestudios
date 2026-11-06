import type { ReactNode } from "react";
import styles from "./Heading.module.scss";

export type HeadingProps = {
  as: "h2" | "h3";
  size: "l" | "m" | "s" | "title" | "title-s";
  children: ReactNode;
};

export function Heading({ as: Tag, size, children }: HeadingProps) {
  return (
    <Tag className={styles.root} data-size={size}>
      {children}
    </Tag>
  );
}
