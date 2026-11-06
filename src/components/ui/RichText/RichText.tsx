import Image from "next/image";
import Link from "next/link";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { BodyImage, RichBody } from "@/lib/sanity/types";
import styles from "./RichText.module.scss";

export type RichTextProps = {
  value: RichBody;
};

const components: PortableTextComponents = {
  types: {
    // Mapped by src/lib/sanity/mappers.ts: alt is guaranteed, the caption is optional.
    image: ({ value }: { value: BodyImage }) => (
      <figure className={styles.figure}>
        <Image
          className={styles.image}
          src={value.image.src}
          alt={value.image.alt}
          width={value.image.width}
          height={value.image.height}
          sizes="(min-width: 800px) 760px, 100vw"
        />
        {value.caption ? <figcaption className={styles.caption}>{value.caption}</figcaption> : null}
      </figure>
    ),
  },
  block: {
    normal: ({ children }) => <p className={styles.p}>{children}</p>,
    h2: ({ children }) => <h2 className={styles.h2}>{children}</h2>,
    h3: ({ children }) => <h3 className={styles.h3}>{children}</h3>,
    h4: ({ children }) => <h4 className={styles.h4}>{children}</h4>,
    blockquote: ({ children }) => <blockquote className={styles.quote}>{children}</blockquote>,
  },
  list: {
    bullet: ({ children }) => <ul className={styles.list}>{children}</ul>,
    number: ({ children }) => <ol className={styles.list}>{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li className={styles.item}>{children}</li>,
    number: ({ children }) => <li className={styles.item}>{children}</li>,
  },
  marks: {
    link: ({ value, children }) => {
      const href: string = typeof value?.href === "string" ? value.href : "#";
      const external = /^https?:\/\//.test(href);
      const internal = href.startsWith("/") && !href.startsWith("//");
      if (internal) {
        return (
          <Link className={styles.link} href={href}>
            {children}
          </Link>
        );
      }
      return external ? (
        <a className={styles.link} href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      ) : (
        <a className={styles.link} href={href}>
          {children}
        </a>
      );
    },
  },
};

export function RichText({ value }: RichTextProps) {
  return (
    <div className={styles.root}>
      <PortableText value={value} components={components} />
    </div>
  );
}
