import Image from "next/image";
import type { ImageRef } from "@/lib/sanity/types";
import { isAbsoluteUrl } from "@/lib/video";
import { Button } from "../Button/Button";
import styles from "./StickyPlayBar.module.scss";

export type StickyPlayBarProps = {
  title: string;
  /** Hidden when empty. */
  meta?: string;
  action: { label: string; href: string };
  /** The game's app icon, at the start of the bar. Decorative: the title names the game. */
  icon?: ImageRef;
};

export function StickyPlayBar({ title, meta, action, icon = null }: StickyPlayBarProps) {
  return (
    <aside className={styles.root} aria-label={`${title} quick play`}>
      <div className={styles.bar} data-icon={Boolean(icon)}>
        {icon ? <Image className={styles.icon} src={icon.src} alt="" width={icon.width} height={icon.height} sizes="40px" /> : null}
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
