import { useId, type ChangeEventHandler } from "react";
import styles from "./TextField.module.scss";

export type TextFieldProps = {
  label: string;
  hideLabel?: boolean;
  name: string;
  type?: "email" | "text";
  placeholder?: string;
  required?: boolean;
  tone?: "on-light" | "on-dark" | "on-card";
  size?: "m" | "s";
  error?: string;
  autoComplete?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

export function TextField({
  label,
  hideLabel = false,
  name,
  type = "text",
  placeholder,
  required,
  tone = "on-light",
  size = "m",
  error,
  autoComplete,
  value,
  onChange,
}: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={styles.root} data-tone={tone} data-size={size}>
      <label htmlFor={id} className={styles.label} data-hidden={hideLabel}>
        {label}
      </label>
      <input
        id={id}
        className={styles.input}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error ? (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
