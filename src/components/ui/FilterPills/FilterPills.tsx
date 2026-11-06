import styles from "./FilterPills.module.scss";

export type FilterPillsProps<T extends string> = {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  label: string;
};

export function FilterPills<T extends string>({ options, value, onChange, label }: FilterPillsProps<T>) {
  return (
    <div className={styles.root} role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option} type="button" className={styles.pill} aria-pressed={option === value} onClick={() => onChange(option)}>
          {option}
        </button>
      ))}
    </div>
  );
}
