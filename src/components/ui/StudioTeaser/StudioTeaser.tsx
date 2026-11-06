import Image from "next/image";
import type { ImageRef } from "@/lib/sanity/types";
import { Button } from "../Button/Button";
import { Eyebrow } from "../Eyebrow/Eyebrow";
import { Heading } from "../Heading/Heading";
import { Placeholder } from "../Placeholder/Placeholder";
import { Text } from "../Text/Text";
import { ValueList } from "../ValueList/ValueList";
import styles from "./StudioTeaser.module.scss";

export type StudioTeaserProps = {
  photo: ImageRef;
  eyebrow: string;
  title: string;
  /** Hidden when empty. */
  body?: string | null;
  values: { title: string; body: string }[];
  action: { label: string; href: string };
};

/** The studio band: a photo beside an eyebrow, heading, intro, values and a link onward. */
export function StudioTeaser({ photo, eyebrow, title, body, values, action }: StudioTeaserProps) {
  return (
    <div className={styles.root}>
      <div className={styles.photo}>
        {photo ? (
          <Image className={styles.image} src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 640px, 100vw" />
        ) : (
          <Placeholder label="Studio photo" radius="none" />
        )}
      </div>
      <div className={styles.text}>
        <Eyebrow tone="link">{eyebrow}</Eyebrow>
        <Heading as="h2" size="l">
          {title}
        </Heading>
        {body ? <Text tone="ink-2">{body}</Text> : null}
        <ValueList items={values} />
        <div className={styles.action}>
          <Button variant="ink" href={action.href}>
            {action.label}
          </Button>
        </div>
      </div>
    </div>
  );
}
