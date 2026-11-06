import Image from "next/image";
import { statusLabel } from "@/lib/games";
import type { Featured } from "@/lib/sanity/types";
import styles from "./SpotlightRail.module.scss";

export type SpotlightRailProps = {
  games: Featured[];
  activeIndex: number;
  onPick: (index: number) => void;
};

export function SpotlightRail({ games, activeIndex, onPick }: SpotlightRailProps) {
  return (
    <div className={styles.root} role="group" aria-label="Choose a featured game">
      {games.map((game, i) => {
        // The app icon suits a small square best; the key art is cropped into it otherwise.
        const thumb = game.icon ?? game.art;
        return (
        <button
          key={game.slug}
          type="button"
          className={styles.item}
          aria-current={i === activeIndex ? "true" : undefined}
          onClick={() => onPick(i)}
        >
          <span className={styles.thumb} aria-hidden="true">
            {thumb ? <Image className={styles.image} src={thumb.src} alt="" width={thumb.width} height={thumb.height} sizes="56px" /> : null}
          </span>
          <span className={styles.text}>
            <span className={styles.name}>{game.name}</span>
            <span className={styles.meta}>{`${game.genre} · ${statusLabel(game.status)}`}</span>
          </span>
        </button>
        );
      })}
    </div>
  );
}
