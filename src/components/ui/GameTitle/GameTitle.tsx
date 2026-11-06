import { statusLabel, type GameStatus } from "@/lib/games";
import { Breadcrumb, type BreadcrumbProps } from "../Breadcrumb/Breadcrumb";
import { Chip } from "../Chip/Chip";
import { Display } from "../Display/Display";
import styles from "./GameTitle.module.scss";

export type GameTitleProps = {
  name: string;
  status: GameStatus;
  /** Genres then platforms, shown as outline chips after the status chip. */
  tags: string[];
  crumbs: BreadcrumbProps["items"];
  /** A short line under the name on phones (the desktop page leads with "About the game" instead). */
  lead?: string;
};

/** The game page's title block: breadcrumb, the page h1 and the status / genre / platform chips. */
export function GameTitle({ name, status, tags, crumbs, lead }: GameTitleProps) {
  const unique = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
  return (
    <div className={styles.root}>
      <div className={styles.crumbs}>
        <Breadcrumb items={crumbs} />
      </div>
      <div className={styles.row}>
        <Display as="h1" size="xl">
          {name}
        </Display>
        <ul className={styles.chips} role="list">
          <li>
            <Chip tone="accent">{statusLabel(status)}</Chip>
          </li>
          {unique.map((tag) => (
            <li key={tag}>
              <Chip tone="outline">{tag}</Chip>
            </li>
          ))}
        </ul>
      </div>
      {lead ? (
        <p className={styles.lead} data-lead="phone">
          {lead}
        </p>
      ) : null}
    </div>
  );
}
