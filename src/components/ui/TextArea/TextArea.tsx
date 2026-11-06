import { useId } from "react";
import styles from "./TextArea.module.scss";

export type TextAreaProps = {
  label: string;
  name: string;
  rows?: number;
  required?: boolean;
  error?: string;
};

export function TextArea({ label, name, rows = 5, required, error }: TextAreaProps) {
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
