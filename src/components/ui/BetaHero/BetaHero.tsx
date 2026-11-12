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
  /** What testers get, shown just above the action with a check mark. */
  perk?: string | null;
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
export function BetaHero({ eyebrow, title, lead, notice, noticeIcon, perk, action, note, art, artLabel }: BetaHeroProps) {
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
      <div className={styles.card} data-eyebrow={Boolean(eyebrow)}>
        <div className={styles.art}>
          {art ? (
            <Image className={styles.image} src={art.src} alt={art.alt} fill priority sizes="(min-width: 1024px) 760px, 100vw" />
          ) : (
            <Placeholder tone="dark" radius="none" label={artLabel} />
          )}
        </div>
        {/* Its own row on desktop, so the art's top lines up with the title, not the eyebrow. */}
        {eyebrow ? (
          <div className={styles.eyebrow}>
            <Eyebrow tone="on-dark-4">{eyebrow}</Eyebrow>
          </div>
        ) : null}
        <div className={styles.body}>
          <Display as="h1" size="l" tone="on-dark">
            {title}
          </Display>
          {lead ? (
            <Text size="lead" tone="on-dark-2">
              {lead}
            </Text>
          ) : null}
          {perk ? (
            <p className={styles.perk}>
              <span className={styles["perk-icon"]} aria-hidden="true">
                <Icon name="check" size={16} />
              </span>
              <span>{perk}</span>
            </p>
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
