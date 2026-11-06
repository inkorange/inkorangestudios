import styles from "./Placeholder.module.scss";

export type PlaceholderProps = {
  tone?: "light" | "dark";
  ratio?: "3/4" | "16/9" | "16/7.5" | "16/10" | "1/1";
  label?: string;
  radius?: "l" | "xl" | "2xl" | "3xl" | "none";
};

export function Placeholder({ tone = "light", ratio, label, radius = "l" }: PlaceholderProps) {
  return (
    <div
      className={styles.root}
      data-tone={tone}
      data-ratio={ratio}
      data-radius={radius}
      aria-hidden={label ? undefined : true}
    >
      {label ? <span className={styles.label}>{label}</span> : null}
    </div>
  );
}
