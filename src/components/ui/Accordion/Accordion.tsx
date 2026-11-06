import type { ReactNode } from "react";
import styles from "./Accordion.module.scss";

export type AccordionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function Accordion({ title, children, defaultOpen = false }: AccordionProps) {
  return (
    <details className={styles.root} open={defaultOpen}>
      <summary className={styles.summary}>
        <span>{title}</span>
        <span className={styles.marker} aria-hidden="true" />
      </summary>
      <div className={styles.panel}>{children}</div>
    </details>
  );
}
