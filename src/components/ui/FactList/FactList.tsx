import styles from "./FactList.module.scss";

export type FactListProps = {
  items: { label: string; value: string }[];
};

export function FactList({ items }: FactListProps) {
  return (
    <dl className={styles.root}>
      {items.map((item, i) => (
        <div key={`${i}-${item.label}`} className={styles.row}>
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
