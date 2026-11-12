import Image from "next/image";
import type { ReactNode } from "react";
import type { ImageRef } from "@/lib/sanity/types";
import { Display } from "../Display/Display";
import { Eyebrow } from "../Eyebrow/Eyebrow";
import { Icon, type IconName } from "../Icon/Icon";
import { Placeholder } from "../Placeholder/Placeholder";
import { Text } from "../Text/Text";
import styles from "./BetaHero.module.scss";

export type BetaHeroProps = {
  eyebrow?: string;
  /** The page's h1. */
  title: string;
  lead?: string;
  /** A must-read line above the hero, such as which phones the beta is open on. */
  notice?: string | null;
  /** The icon beside the notice. */
  noticeIcon?: IconName;
  /** The signup form, or a button once testing has closed. */
  action?: ReactNode;
  /** A small line under the action: what happens next. */
  note?: string;
  art: ImageRef;
  /** Label on the placeholder shown when there is no art. */
  artLabel: string;
};

/**
 * The top of a game's tester page: an optional notice on paper, then a dark card with the pitch and the
 * signup on one side and the key art on the other (stacked on a phone, art first).
 */
export function BetaHero({ eyebrow, title, lead, notice, noticeIcon, action, note, art, artLabel }: BetaHeroProps) {
  return (
    <div className={styles.root}>
      {notice ? (
        <p className={styles.notice}>
          {noticeIcon ? (
            <span className={styles["notice-icon"]} aria-hidden="true">
              <Icon name={noticeIcon} size={20} />
            </span>
          ) : null}
          <span>{notice}</span>
        </p>
      ) : null}
      <div className={styles.card}>
        <div className={styles.art}>
          {art ? (
            <Image className={styles.image} src={art.src} alt={art.alt} fill priority sizes="(min-width: 1024px) 760px, 100vw" />
          ) : (
            <Placeholder tone="dark" radius="none" label={artLabel} />
          )}
        </div>
        <div className={styles.body}>
          {eyebrow ? <Eyebrow tone="on-dark-4">{eyebrow}</Eyebrow> : null}
          <Display as="h1" size="l" tone="on-dark">
            {title}
          </Display>
          {lead ? (
            <Text size="lead" tone="on-dark-2">
              {lead}
            </Text>
          ) : null}
          {action ? <div className={styles.action}>{action}</div> : null}
          {note ? (
            <Text size="body-s" tone="on-dark-3">
              {note}
            </Text>
          ) : null}
        </div>
      </div>
    </div>
  );
}
