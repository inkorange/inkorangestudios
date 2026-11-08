import type { ReactNode } from "react";
import styles from "./GameLayout.module.scss";

export type GameLayoutProps = {
  /** `GameTitle`. */
  title: ReactNode;
  /** The game's key art (`FramedPhoto`), right under the title. */
  art?: ReactNode;
  /** `MediaViewer`. */
  media?: ReactNode;
  /** `StoreCard` (right column on desktop, under the title on phones). */
  store?: ReactNode;
  /** Main column blocks, in order. */
  about?: ReactNode;
  features?: ReactNode;
  /** Phone only (hidden from `lg`): the "Game details" accordion; desktop shows the facts in the store card. */
  details?: ReactNode;
  updates?: ReactNode;
  /** A `CalloutBand` (the beta tester signup or its closed notice): full width under the columns. */
  beta?: ReactNode;
  /** Press kit / help `InfoCard`s: under the store card on desktop, last on phones. */
  cards?: ReactNode;
  /** A full-width band after the columns (the sand "More from inkOrange" section). */
  more?: ReactNode;
};

/**
 * The game page body. Desktop: title, key art and media full width, then a main column
 * beside the store card and info cards, then the full-width band. Phones: one
 * column in the desktop order (title, key art, media, store, main column, beta, band, cards).
 */
export function GameLayout({ title, art, media, store, about, features, details, updates, beta, cards, more }: GameLayoutProps) {
  const hasMain = Boolean(about || features || details || updates);
  return (
    <div className={styles.root}>
      <div className={styles.frame} data-frame="" data-store={Boolean(store)} data-art={Boolean(art)}>
        <div className={styles.title} data-slot="title">
          {title}
        </div>
        {art ? (
          <div className={styles.art} data-slot="art">
            {art}
          </div>
        ) : null}
        {media ? (
          <div className={styles.media} data-slot="media">
            {media}
          </div>
        ) : null}
        {store ? (
          <div className={styles.store} data-slot="store">
            {store}
          </div>
        ) : null}
        {hasMain ? (
          <div className={styles.main} data-slot="main">
            {about ? <div data-slot="about">{about}</div> : null}
            {features ? <div data-slot="features">{features}</div> : null}
            {details ? (
              <div className={styles.details} data-slot="details">
                {details}
              </div>
            ) : null}
            {updates ? <div data-slot="updates">{updates}</div> : null}
          </div>
        ) : null}
        {cards ? (
          <div className={styles.cards} data-slot="cards">
            {cards}
          </div>
        ) : null}
        {beta ? (
          <div className={styles.beta} data-slot="beta" id="beta">
            {beta}
          </div>
        ) : null}
      </div>
      {more ? (
        <div className={styles.more} data-slot="more">
          {more}
        </div>
      ) : null}
    </div>
  );
}
