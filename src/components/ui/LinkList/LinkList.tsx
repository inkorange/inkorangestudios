import Link from "next/link";
import styles from "./LinkList.module.scss";

export type LinkListProps = {
  /** Accessible name for the list. */
  label: string;
  items: { label: string; href: string }[];
};

/** A plain vertical list of links with comfortable tap targets. */
export function LinkList({ label, items }: LinkListProps) {
  if (items.length === 0) return null;
  return (
    <ul className={styles.root} role="list" aria-label={label}>
      {items.map((item) => (
        <li key={item.href}>
          <Link className={styles.link} href={item.href}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
