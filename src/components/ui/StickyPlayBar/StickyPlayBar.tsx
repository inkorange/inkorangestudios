import { isAbsoluteUrl } from "@/lib/video";
import { Button } from "../Button/Button";
import styles from "./StickyPlayBar.module.scss";

export type StickyPlayBarProps = {
  title: string;
  /** Hidden when empty. */
  meta?: string;
  action: { label: string; href: string };
};

export function StickyPlayBar({ title, meta, action }: StickyPlayBarProps) {
  return (
    <aside className={styles.root} aria-label={`${title} quick play`}>
      <div className={styles.bar}>
        <span className={styles.text}>
          <span className={styles.title}>{title}</span>
          {meta ? <span className={styles.meta}>{meta}</span> : null}
        </span>
        <Button variant="accent" href={action.href} external={isAbsoluteUrl(action.href)}>
          {action.label}
        </Button>
      </div>
    </aside>
  );
}
