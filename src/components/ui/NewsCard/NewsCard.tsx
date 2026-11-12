import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { postKindLabel, type ImageRef, type PostKind } from "@/lib/sanity/types";
import { Icon } from "../Icon/Icon";
import { Placeholder } from "../Placeholder/Placeholder";
import styles from "./NewsCard.module.scss";

export type NewsCardProps = {
  href: string;
  image: ImageRef;
  /** ISO date. */
  date: string;
  kind: PostKind;
  title: string;
  /** The publication, for an article on another site: the card opens it in a new tab, says IN THE NEWS in place of the kind, and ends with "Read on {source}". */
  source?: string;
};

export function NewsCard({ href, image, date, kind, title, source }: NewsCardProps) {
  const content = (
    <>
      <span className={styles.media}>
        {image ? (
          <Image className={styles.image} src={image.src} alt={image.alt} width={image.width} height={image.height} sizes="(min-width: 1024px) 420px, 100vw" />
        ) : (
          <Placeholder radius="none" />
        )}
      </span>
      <span className={styles.body}>
        <span className={styles.meta}>
          {formatDate(date)} · {source ? "IN THE NEWS" : postKindLabel(kind)}
        </span>
        <span className={styles.title}>{title}</span>
        {source ? (
          <span className={styles.source}>
            Read on {source}
            <Icon name="external" size={16} />
            <span className={styles.hidden}>(opens in a new tab)</span>
          </span>
        ) : null}
      </span>
    </>
  );
  return source ? (
    <a href={href} className={styles.root} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  ) : (
    <Link href={href} className={styles.root}>
      {content}
    </Link>
  );
}
