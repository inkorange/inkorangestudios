import styles from "./FeatureList.module.scss";

export type FeatureListProps = {
  items: { title: string; body: string }[];
};

export function FeatureList({ items }: FeatureListProps) {
  return (
    <ol className={styles.root} role="list">
      {items.map((item, i) => (
        <li key={`${i}-${item.title}`} className={styles.item}>
          <span className={styles.marker} aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className={styles.title}>{item.title}</h3>
            <p className={styles.body}>{item.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
