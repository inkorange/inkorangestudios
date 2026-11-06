import type { ReactNode } from "react";
import { isAbsoluteUrl } from "@/lib/video";
import { Accordion } from "../Accordion/Accordion";
import { Button } from "../Button/Button";
import { Eyebrow } from "../Eyebrow/Eyebrow";
import { FactList } from "../FactList/FactList";
import { Icon } from "../Icon/Icon";
import styles from "./StoreCard.module.scss";

export type StoreCardProps = {
  priceLabel?: string;
  primary: { label: string; href: string } | null;
  notify?: ReactNode;
  notifyTitle?: string;
  facts: { label: string; value: string }[];
};

export function StoreCard({ priceLabel, primary, notify, notifyTitle, facts }: StoreCardProps) {
  return (
    <aside className={styles.root} aria-label="Get the game">
      <Eyebrow>GET THE GAME</Eyebrow>
      {priceLabel ? <p className={styles.price}>{priceLabel}</p> : null}
      {primary ? (
        <Button variant="accent" size="l" block icon="globe" href={primary.href} external={isAbsoluteUrl(primary.href)}>
          {primary.label}
        </Button>
      ) : null}
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
          <div className={styles["facts-phone"]}>
            <Accordion title="Game details">
              <FactList items={facts} />
            </Accordion>
          </div>
        </>
      ) : null}
    </aside>
  );
}
