import type { ReactNode } from "react";
import { STORE_LINK_LABELS } from "@/lib/games";
import type { StoreLink } from "@/lib/sanity/types";
import { isAbsoluteUrl } from "@/lib/video";
import { Accordion } from "../Accordion/Accordion";
import { Button } from "../Button/Button";
import { Eyebrow } from "../Eyebrow/Eyebrow";
import { FactList } from "../FactList/FactList";
import { Icon } from "../Icon/Icon";
import { StoreBadges } from "../StoreBadges/StoreBadges";
import styles from "./StoreCard.module.scss";

export type StoreCardProps = {
  priceLabel?: string;
  primary: { label: string; href: string } | null;
  /** Store links: official Google Play and App Store badges, and a "Play in your browser" button for Web. */
  stores?: StoreLink[];
  notify?: ReactNode;
  notifyTitle?: string;
  facts: { label: string; value: string }[];
  /** Show the "Game details" accordion below `lg` (default). Turn off when the page places it elsewhere. */
  phoneFacts?: boolean;
};

export function StoreCard({ priceLabel, primary, stores = [], notify, notifyTitle, facts, phoneFacts = true }: StoreCardProps) {
  // The web link doubles up when the main button already goes there.
  const web = stores.find((s) => s.platform === "Web" && s.href !== primary?.href);
  return (
    <aside className={styles.root} aria-label="Get the game">
      <span className={styles.eyebrow}>
        <Eyebrow>GET THE GAME</Eyebrow>
      </span>
      {priceLabel ? <p className={styles.price}>{priceLabel}</p> : null}
      {primary ? (
        <Button variant="accent" size="l" block icon="globe" href={primary.href} external={isAbsoluteUrl(primary.href)}>
          {primary.label}
        </Button>
      ) : null}
      {web ? (
        <Button variant={primary ? "outline" : "accent"} size="l" block icon="globe" href={web.href} external>
          {STORE_LINK_LABELS.Web.badge}
        </Button>
      ) : null}
      <StoreBadges stores={stores} label="App stores" />
      {notify ? (
        <div className={styles.notify}>
          {notifyTitle ? (
            <p className={styles["notify-title"]}>
              <Icon name="phone" size={16} />
              <span>{notifyTitle}</span>
            </p>
          ) : null}
          {notify}
        </div>
      ) : null}
      {facts.length > 0 ? (
        <>
          <div className={styles["facts-desktop"]}>
            <FactList items={facts} />
          </div>
          {phoneFacts ? (
            <div className={styles["facts-phone"]}>
              <Accordion title="Game details">
                <FactList items={facts} />
              </Accordion>
            </div>
          ) : null}
        </>
      ) : null}
    </aside>
  );
}
