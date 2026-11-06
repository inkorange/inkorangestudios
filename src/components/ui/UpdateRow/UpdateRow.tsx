import Link from "next/link";
import { formatDate } from "@/lib/format";
import styles from "./UpdateRow.module.scss";

export type UpdateRowProps = {
  href: string;
  /** ISO date. */
  date: string;
  title: string;
};

export function UpdateRow({ href, date, title }: UpdateRowProps) {
  return (
    <Link href={href} className={styles.root}>
      <span className={styles.date}>{formatDate(date)}</span>
      <span className={styles.title}>{title}</span>
    </Link>
  );
}
