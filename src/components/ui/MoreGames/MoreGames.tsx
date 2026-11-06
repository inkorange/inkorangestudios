import type { GameSummary } from "@/lib/sanity/types";
import { GameTile } from "../GameTile/GameTile";
import { SectionHeader } from "../SectionHeader/SectionHeader";
import styles from "./MoreGames.module.scss";

export type MoreGamesProps = {
  games: GameSummary[];
  title?: string;
  action?: { label: string; href: string };
};

/** "More from inkOrange": a header and small game tiles; a sideways scroller on phones, a grid from `md`. */
export function MoreGames({ games, title = "More from inkOrange", action = { label: "All games →", href: "/#games" } }: MoreGamesProps) {
  if (games.length === 0) return null;
  return (
    <div className={styles.root}>
      <SectionHeader title={title} action={action} />
      <ul className={styles.list} role="list" aria-label="More games">
        {games.map((game) => (
          <li key={game.slug} className={styles.item}>
            <GameTile
              size="s"
              name={game.name}
              href={`/games/${game.slug}`}
              cover={game.cover}
              status={game.status}
              meta={[game.genre, game.platformLabel].filter(Boolean).join(" · ")}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
