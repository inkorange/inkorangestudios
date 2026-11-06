import { Display } from "../Display/Display";
import { Eyebrow } from "../Eyebrow/Eyebrow";
import { Text } from "../Text/Text";
import styles from "./PageHero.module.scss";

export type PageHeroProps = {
  /** Hidden when empty. */
  eyebrow?: string;
  title: string;
  /** Hidden when empty. */
  intro?: string;
};

/** The top of a content page: optional eyebrow, the page `h1`, and an intro line. */
export function PageHero({ eyebrow, title, intro }: PageHeroProps) {
  return (
    <div className={styles.root}>
      {eyebrow ? <Eyebrow tone="link">{eyebrow}</Eyebrow> : null}
      <Display as="h1" size="l">
        {title}
      </Display>
      {intro ? (
        <Text size="lead" tone="ink-2">
          {intro}
        </Text>
      ) : null}
    </div>
  );
}
