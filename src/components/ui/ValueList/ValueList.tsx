import styles from "./ValueList.module.scss";

export type ValueListProps = {
  items: { title: string; body: string }[];
};

export function ValueList({ items }: ValueListProps) {
  return (
    <ul className={styles.root} role="list">
      {items.map((item, i) => (
        <li key={`${i}-${item.title}`} className={styles.item}>
          <p className={styles.title}>{item.title}</p>
          <p className={styles.body}>{item.body}</p>
        </li>
      ))}
    </ul>
  );
}
