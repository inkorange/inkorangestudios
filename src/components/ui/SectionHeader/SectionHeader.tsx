import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./SectionHeader.module.scss";

export type SectionHeaderProps = {
  title: string;
  as?: "h1" | "h2";
  size?: "l" | "m";
  action?: { label: string; href: string };
  /** e.g. FilterPills */
  children?: ReactNode;
  rule?: boolean;
};

export function SectionHeader({ title, as: Tag = "h2", size = "l", action, children, rule = true }: SectionHeaderProps) {
  return (
    <div className={styles.root} data-rule={rule} data-size={size}>
      <Tag className={styles.title}>{title}</Tag>
      {children}
      {action ? (
        <Link href={action.href} className={styles.action}>
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
