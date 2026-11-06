import { useEffect, useId, useRef, type ChangeEventHandler } from "react";
import { Icon } from "../Icon/Icon";
import styles from "./Select.module.scss";

type Controlled =
  | { value: string; onChange: ChangeEventHandler<HTMLSelectElement> }
  | { value?: undefined; onChange?: undefined };

export type SelectProps = {
  label: string;
  hideLabel?: boolean;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  tone?: "on-light" | "on-dark" | "on-card" | "on-accent";
  required?: boolean;
} & Controlled;

export function Select({
  label,
  hideLabel = false,
  name,
  options,
  defaultValue,
  tone = "on-light",
  required,
  value,
  onChange,
}: SelectProps) {
  const id = useId();
  const ref = useRef<HTMLSelectElement>(null);
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  });
  // React 19 resets a form after its action; a controlled <select> is not re-synced
  // by that reset (inputs are), so put the controlled value back once the reset lands.
  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const restore = () =>
      queueMicrotask(() => {
        if (ref.current && latest.current !== undefined) ref.current.value = latest.current;
      });
    form.addEventListener("reset", restore);
    return () => form.removeEventListener("reset", restore);
  }, []);

  return (
    <div className={styles.root} data-tone={tone}>
      <label htmlFor={id} className={styles.label} data-hidden={hideLabel}>
        {label}
      </label>
      <div className={styles.wrap}>
        <select
          id={id}
          ref={ref}
          className={styles.input}
          name={name}
          required={required}
          {...(value === undefined ? { defaultValue } : { value, onChange })}
        >
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
