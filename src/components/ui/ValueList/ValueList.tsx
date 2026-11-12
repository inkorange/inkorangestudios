import styles from "./ValueList.module.scss";

export type ValueListProps = {
  items: { title: string; body: string }[];
  /** Phone layout: `row` (title left, body right; short titles) or `stack` (title above body; longer copy). */
  phone?: "row" | "stack";
};

export function ValueList({ items, phone = "row" }: ValueListProps) {
  return (
    <ul className={styles.root} role="list" data-phone={phone}>
      {items.map((item, i) => (
        <li key={`${i}-${item.title}`} className={styles.item}>
          <p className={styles.title}>{item.title}</p>
          <p className={styles.body}>{item.body}</p>
        </li>
      ))}
    </ul>
  );
}
