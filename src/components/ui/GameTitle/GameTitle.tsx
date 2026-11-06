import Image from "next/image";
import { statusLabel, type GameStatus, type Platform } from "@/lib/games";
import type { ImageRef } from "@/lib/sanity/types";
import { Breadcrumb, type BreadcrumbProps } from "../Breadcrumb/Breadcrumb";
import { Chip } from "../Chip/Chip";
import { Display } from "../Display/Display";
import type { IconName } from "../Icon/Icon";
import styles from "./GameTitle.module.scss";

export type GameTitleProps = {
  name: string;
  /** The game's app icon, beside the name. Decorative: the name is right next to it. */
  icon?: ImageRef;
  status: GameStatus;
  /** Genres, shown as outline chips under the name. */
  tags: string[];
  /** Shown after the status chip, above the name, each as an outline chip with its logo. */
  platforms?: Platform[];
  crumbs: BreadcrumbProps["items"];
  /** A short line under the name on phones (the desktop page leads with "About the game" instead). */
  lead?: string;
};

const PLATFORM_ICONS: Record<Platform, IconName> = { Android: "android", iOS: "apple", Web: "globe" };

/** The game page's title block: breadcrumb, status and platform chips, the page h1, then genre chips. */
export function GameTitle({ name, icon = null, status, tags, platforms = [], crumbs, lead }: GameTitleProps) {
  const unique = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
  return (
    <div className={styles.root}>
      <div className={styles.crumbs}>
        <Breadcrumb items={crumbs} />
      </div>
      <ul className={styles.chips} role="list" aria-label="Status and platforms">
        <li>
          <Chip tone="accent">{statusLabel(status)}</Chip>
        </li>
        {platforms.map((platform) => (
          <li key={platform}>
            <Chip tone="outline" icon={PLATFORM_ICONS[platform]}>
              {platform}
            </Chip>
          </li>
        ))}
      </ul>
      <div className={styles.name}>
        {icon ? <Image className={styles.icon} src={icon.src} alt="" width={icon.width} height={icon.height} sizes="96px" priority /> : null}
        <Display as="h1" size="xl">
          {name}
        </Display>
      </div>
      {unique.length > 0 ? (
        <ul className={styles.chips} role="list" aria-label="Genres">
          {unique.map((tag) => (
            <li key={tag}>
              <Chip tone="outline">{tag}</Chip>
            </li>
          ))}
        </ul>
      ) : null}
      {lead ? (
        <p className={styles.lead} data-lead="phone">
          {lead}
        </p>
      ) : null}
    </div>
  );
}
