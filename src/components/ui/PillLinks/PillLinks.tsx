import Link from "next/link";
import styles from "./PillLinks.module.scss";

export type PillLinksProps = {
  /** Names the nav ("Filter news by game"). */
  label: string;
  items: { label: string; href: string }[];
  /** The href of the page being shown; that pill is selected. */
  current: string;
};

/** Filter pills that are links: each choice is its own URL, so filtering works without script. */
export function PillLinks({ label, items, current }: PillLinksProps) {
  if (items.length < 2) return null;
  return (
    <nav aria-label={label}>
      <ul className={styles.list} role="list">
        {items.map((item) => (
          <li key={item.href}>
            <Link className={styles.pill} href={item.href} aria-current={item.href === current ? "page" : undefined}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
