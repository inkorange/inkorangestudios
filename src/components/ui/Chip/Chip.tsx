import type { ReactNode } from "react";
import { Icon, type IconName } from "../Icon/Icon";
import styles from "./Chip.module.scss";

export type ChipProps = {
  tone: "accent" | "ink" | "outline" | "outline-on-dark" | "plain-on-dark";
  size?: "s" | "m";
  /** A leading icon, e.g. a platform logo. Decorative: the text names the thing. */
  icon?: IconName;
  children: ReactNode;
};

export function Chip({ tone, size = "m", icon, children }: ChipProps) {
  return (
    <span className={styles.root} data-tone={tone} data-size={size} data-icon={Boolean(icon)}>
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </span>
  );
}
