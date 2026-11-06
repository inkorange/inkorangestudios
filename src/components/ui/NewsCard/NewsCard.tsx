import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { postKindLabel, type ImageRef, type PostKind } from "@/lib/sanity/types";
import { Placeholder } from "../Placeholder/Placeholder";
import styles from "./NewsCard.module.scss";

export type NewsCardProps = {
  href: string;
  image: ImageRef;
  /** ISO date. */
  date: string;
  kind: PostKind;
  title: string;
};

export function NewsCard({ href, image, date, kind, title }: NewsCardProps) {
  return (
    <Link href={href} className={styles.root}>
      <span className={styles.media}>
        {image ? (
          <Image className={styles.image} src={image.src} alt={image.alt} width={image.width} height={image.height} sizes="(min-width: 1024px) 420px, 100vw" />
        ) : (
          <Placeholder radius="none" />
        )}
      </span>
      <span className={styles.body}>
        <span className={styles.meta}>
          {formatDate(date)} · {postKindLabel(kind)}
        </span>
        <span className={styles.title}>{title}</span>
      </span>
    </Link>
  );
}
