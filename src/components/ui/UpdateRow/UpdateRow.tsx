import Link from "next/link";
import { formatDate } from "@/lib/format";
import { Icon } from "../Icon/Icon";
import styles from "./UpdateRow.module.scss";

export type UpdateRowProps = {
  href: string;
  /** ISO date. */
  date: string;
  title: string;
  /** The publication, for an article on another site: the row opens it in a new tab and names it after the headline. */
  source?: string;
};

export function UpdateRow({ href, date, title, source }: UpdateRowProps) {
  const content = (
    <>
      <span className={styles.date}>{formatDate(date)}</span>
      <span className={styles.title}>{title}</span>
      {source ? (
        <span className={styles.source}>
          {source.toUpperCase()}
          <Icon name="external" size={16} />
          <span className={styles.hidden}>(opens in a new tab)</span>
        </span>
      ) : null}
    </>
  );
  return source ? (
    <a href={href} className={styles.root} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  ) : (
    <Link href={href} className={styles.root}>
      {content}
    </Link>
  );
}
