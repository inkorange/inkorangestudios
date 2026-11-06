import Image from "next/image";
import { STORE_LINK_LABELS } from "@/lib/games";
import type { StoreLink } from "@/lib/sanity/types";
import styles from "./StoreBadges.module.scss";

export type StoreBadgesProps = {
  /** Any store links; only Android (Google Play) and iOS (App Store) have badges, the rest are skipped. */
  stores: StoreLink[];
  /** Names the list for screen readers, e.g. "App stores" or "TerraForge in the app stores". */
  label: string;
  /** `m`: `--control-height` (store card). `s`: `--tap-min` (game tiles). */
  size?: "m" | "s";
};

/** The official badge artwork, as Apple and Google supply it (the Google PNG trimmed of its clear space). */
const BADGES = {
  Android: { src: "/badges/google-play.png", width: 564, height: 168 },
  iOS: { src: "/badges/app-store.svg", width: 120, height: 40 },
} as const;

type BadgeStore = StoreLink & { platform: keyof typeof BADGES };

/** Official Google Play and App Store badges, each a link to the store in a new tab. Renders nothing without one. */
export function StoreBadges({ stores, label, size = "m" }: StoreBadgesProps) {
  const badges = stores.filter((s): s is BadgeStore => s.platform in BADGES);
  if (badges.length === 0) return null;
  return (
    <ul className={styles.root} data-size={size} aria-label={label}>
      {badges.map((s) => {
        const badge = BADGES[s.platform];
        return (
          <li key={s.platform}>
            <a className={styles.link} href={s.href} target="_blank" rel="noopener noreferrer">
              <Image
                className={styles.image}
                src={badge.src}
                alt={STORE_LINK_LABELS[s.platform].badge}
                width={badge.width}
                height={badge.height}
                unoptimized={badge.src.endsWith(".svg")}
              />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
