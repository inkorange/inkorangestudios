import { Icon, type IconName } from "../Icon/Icon";
import styles from "./IconButton.module.scss";

export type IconButtonProps = {
  icon: IconName;
  label: string;
  tone?: "light" | "dark";
  size?: "m" | "l";
  onClick?: () => void;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
};

export function IconButton({ icon, label, tone = "light", size = "m", onClick, "aria-expanded": expanded, "aria-controls": controls }: IconButtonProps) {
  return (
    <button
      type="button"
      className={styles.root}
      data-tone={tone}
      data-size={size}
      aria-label={label}
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
    >
      <Icon name={icon} size={size === "l" ? 20 : 18} />
    </button>
  );
}
