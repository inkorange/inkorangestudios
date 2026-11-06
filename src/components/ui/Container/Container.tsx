import type { ReactNode } from "react";
import styles from "./Container.module.scss";

export type ContainerProps = {
  children: ReactNode;
  width?: "content" | "narrow";
};

export function Container({ children, width = "content" }: ContainerProps) {
  return (
    <div className={styles.root} data-width={width}>
      {children}
    </div>
  );
}
