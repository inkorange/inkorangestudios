"use client";

import { useState } from "react";
import type { GameSummary } from "@/lib/sanity/types";
import { FilterPills } from "../FilterPills/FilterPills";
import { GameTile } from "../GameTile/GameTile";
import { SectionHeader } from "../SectionHeader/SectionHeader";
import { Text } from "../Text/Text";
import styles from "./GameGrid.module.scss";

const FILTERS = ["All", "Out now", "Coming soon"] as const;
type Filter = (typeof FILTERS)[number];

export type GameGridProps = {
  games: GameSummary[];
  title?: string;
};

function matches(filter: Filter, game: GameSummary): boolean {
  if (filter === "Out now") return game.status === "out-now";
  // "Coming soon" is everything not yet out: coming soon, in development, announcing soon.
  if (filter === "Coming soon") return game.status !== "out-now";
  return true;
}

export function GameGrid({ games, title = "All games" }: GameGridProps) {
  const [filter, setFilter] = useState<Filter>("All");
  const shown = games.filter((game) => matches(filter, game));

  return (
    <div className={styles.root}>
      <SectionHeader title={title}>
        {games.length > 0 ? <FilterPills options={FILTERS} value={filter} onChange={setFilter} label="Filter games" /> : null}
      </SectionHeader>
      {shown.length > 0 ? (
        <ul className={styles.grid} role="list" aria-label="Games">
          {shown.map((game) => (
            <li key={game.slug}>
              <GameTile
                name={game.name}
                href={`/games/${game.slug}`}
                cover={game.cover}
                status={game.status}
                meta={[game.genre, game.platformLabel].filter(Boolean).join(" · ")}
                stores={game.stores}
              />
            </li>
          ))}
        </ul>
      ) : (
        <Text tone="ink-2">New games are on the way.</Text>
      )}
    </div>
  );
}
