import Link from "next/link";
import { NAV_ITEMS, type NavCurrent, type NavKey } from "@/lib/nav";
import styles from "./NavPillBar.module.scss";

export type NavPillBarProps = {
  active?: NavKey;
  /** `page` (default) for the item's own page, `true` for a page inside its section. */
  current?: NavCurrent;
};

export function NavPillBar({ active, current = "page" }: NavPillBarProps) {
  return (
    <nav aria-label="Primary" className={styles.root}>
      <ul className={styles.list} role="list">
        {NAV_ITEMS.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className={styles.link}
              data-active={item.key === active}
              aria-current={item.key === active ? current : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
