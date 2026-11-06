"use client";

import { useId, type ChangeEventHandler } from "react";
import { Icon } from "../Icon/Icon";
import styles from "./Select.module.scss";

export type SelectProps = {
  label: string;
  hideLabel?: boolean;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  tone?: "on-light" | "on-dark" | "on-card" | "on-accent";
  /** Fires on every change; use it to remember the choice and re-seed `defaultValue`. */
  onChange?: ChangeEventHandler<HTMLSelectElement>;
};

export function Select({ label, hideLabel = false, name, options, defaultValue, tone = "on-light", onChange }: SelectProps) {
  const id = useId();
  return (
    <div className={styles.root} data-tone={tone}>
      <label htmlFor={id} className={styles.label} data-hidden={hideLabel}>
        {label}
      </label>
      <div className={styles.wrap}>
        <select id={id} className={styles.input} name={name} defaultValue={defaultValue} onChange={onChange}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className={styles.chevron}>
          <Icon name="chevron-right" size={18} />
        </span>
      </div>
    </div>
  );
}
