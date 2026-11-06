import { isAbsoluteUrl } from "@/lib/video";
import { Button } from "../Button/Button";
import styles from "./StickyPlayBar.module.scss";

export type StickyPlayBarProps = {
  title: string;
  meta: string;
  action: { label: string; href: string };
};

export function StickyPlayBar({ title, meta, action }: StickyPlayBarProps) {
  return (
    <div className={styles.root}>
      <div className={styles.bar}>
        <span className={styles.text}>
          <span className={styles.title}>{title}</span>
          <span className={styles.meta}>{meta}</span>
        </span>
        <Button variant="accent" href={action.href} external={isAbsoluteUrl(action.href)}>
          {action.label}
        </Button>
      </div>
    </div>
  );
}
