import { useId, type ChangeEventHandler } from "react";
import styles from "./TextArea.module.scss";

type Controlled =
  | { value: string; onChange: ChangeEventHandler<HTMLTextAreaElement> }
  | { value?: undefined; onChange?: undefined };

export type TextAreaProps = {
  label: string;
  name: string;
  rows?: number;
  required?: boolean;
  error?: string;
} & Controlled;

export function TextArea({ label, name, rows = 5, required, error, value, onChange }: TextAreaProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={styles.root}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <textarea
        id={id}
        className={styles.input}
        name={name}
        rows={rows}
        required={required}
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
