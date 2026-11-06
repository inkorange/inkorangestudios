import type { ReactNode } from "react";
import styles from "./Statement.module.scss";

export type StatementProps = {
  /** A `Display` heading, usually with one `Highlight`. */
  title: ReactNode;
  body: string;
};

/** A big display line with a short paragraph beside it (below it on narrow screens). */
export function Statement({ title, body }: StatementProps) {
  return (
    <div className={styles.root}>
      <div className={styles.title}>{title}</div>
      <p className={styles.body}>{body}</p>
    </div>
  );
}
