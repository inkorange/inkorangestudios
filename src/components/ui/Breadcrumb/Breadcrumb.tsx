import Link from "next/link";
import styles from "./Breadcrumb.module.scss";

export type BreadcrumbProps = {
  items: { label: string; href?: string }[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  const last = items.length - 1;
  return (
    <nav aria-label="Breadcrumb" className={styles.root}>
      <ol className={styles.list} role="list">
        {items.map((item, i) => (
          <li key={`${i}-${item.label}`} className={styles.item}>
            {i === last || !item.href ? (
              <span className={styles.current} aria-current={i === last ? "page" : undefined}>
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className={styles.link}>
                {item.label}
              </Link>
            )}
            {i < last ? (
              <span className={styles.sep} aria-hidden="true">
                /
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
