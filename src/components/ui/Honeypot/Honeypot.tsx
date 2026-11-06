import styles from "./Honeypot.module.scss";

export type HoneypotProps = {
  name?: string;
};

/** A spam trap: invisible to people and assistive tech, tempting to bots. */
export function Honeypot({ name = "website" }: HoneypotProps) {
  return (
    <div className={styles.root} aria-hidden="true">
      <input type="text" name={name} tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  );
}
