import type { PostSummary } from "@/lib/sanity/types";
import { NewsCard } from "../NewsCard/NewsCard";
import styles from "./NewsRail.module.scss";

export type NewsRailProps = {
  posts: PostSummary[];
  label?: string;
};

/** News cards: a grid from `md`, a horizontal scroller that bleeds to the right edge on phones. */
export function NewsRail({ posts, label = "Latest news" }: NewsRailProps) {
  if (posts.length === 0) return null;
  return (
    <ul className={styles.root} role="list" aria-label={label}>
      {posts.map((post) => (
        <li key={post.slug} className={styles.item}>
          <NewsCard href={`/news/${post.slug}`} image={post.image} date={post.date} kind={post.kind} title={post.title} />
        </li>
      ))}
    </ul>
  );
}
