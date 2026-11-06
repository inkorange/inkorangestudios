import Image from "next/image";
import Link from "next/link";
import { statusLabel, type GameStatus } from "@/lib/games";
import type { ImageRef } from "@/lib/sanity/types";
import { Chip } from "../Chip/Chip";
import { Placeholder } from "../Placeholder/Placeholder";
import styles from "./GameTile.module.scss";

export type GameTileProps = {
  name: string;
  href: string;
  cover: ImageRef;
  status: GameStatus;
  meta: string;
  size?: "m" | "s";
};

export function GameTile({ name, href, cover, status, meta, size = "m" }: GameTileProps) {
  return (
    <Link href={href} className={styles.root} data-size={size}>
      <span className={styles.cover}>
        {cover ? (
          <Image className={styles.image} src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} sizes="(min-width: 1024px) 300px, 50vw" />
        ) : (
          <span aria-hidden="true">
            <Placeholder ratio="3/4" label={name} />
          </span>
        )}
        <span className={styles.chip}>
          <Chip tone={status === "out-now" ? "accent" : "ink"} size="s">
            {statusLabel(status)}
          </Chip>
        </span>
      </span>
      <span className={styles.name}>{name}</span>
      <span className={styles.meta}>{meta}</span>
    </Link>
  );
}
