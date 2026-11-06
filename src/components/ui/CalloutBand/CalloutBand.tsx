import type { ReactNode } from "react";
import { Display } from "../Display/Display";
import { Eyebrow } from "../Eyebrow/Eyebrow";
import styles from "./CalloutBand.module.scss";

export type CalloutBandProps = {
  eyebrow: string;
  title: string;
  body: string;
  action: ReactNode;
  /** Watercolor wash along the right edge, kept subtle so ink text keeps its contrast. */
  paint?: boolean;
};

export function CalloutBand({ eyebrow, title, body, action, paint = false }: CalloutBandProps) {
  return (
    <section className={styles.root} data-paint={paint}>
      <div className={styles.text}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Display size="m">{title}</Display>
        <p className={styles.body}>{body}</p>
      </div>
      <div className={styles.action}>{action}</div>
    </section>
  );
}
