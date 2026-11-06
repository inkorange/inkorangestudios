import Link from "next/link";
import styles from "./InfoCard.module.scss";

export type InfoCardProps = {
  title: string;
  body: string;
  link: { label: string; href: string };
  /** `auto`: a row below `lg`, a stack from `lg` (the game page's press and help cards). */
  layout?: "stack" | "row" | "auto";
};

export function InfoCard({ title, body, link, layout = "stack" }: InfoCardProps) {
  const external = /^(https?:|mailto:)/.test(link.href);
  return (
    <div className={styles.root} data-layout={layout}>
      <div className={styles.text}>
        <p className={styles.title}>{title}</p>
        <p className={styles.body}>{body}</p>
      </div>
      {external ? (
        <a href={link.href} className={styles.link}>
          {link.label}
        </a>
      ) : (
        <Link href={link.href} className={styles.link}>
          {link.label}
        </Link>
      )}
    </div>
  );
}
