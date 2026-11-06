import Link from "next/link";
import { NAV_ITEMS, type NavKey } from "@/lib/nav";
import styles from "./NavPillBar.module.scss";

export type NavPillBarProps = {
  active?: NavKey;
};

export function NavPillBar({ active }: NavPillBarProps) {
  return (
    <nav aria-label="Primary" className={styles.root}>
      <ul className={styles.list} role="list">
        {NAV_ITEMS.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className={styles.link}
              data-active={item.key === active}
              aria-current={item.key === active ? "page" : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
