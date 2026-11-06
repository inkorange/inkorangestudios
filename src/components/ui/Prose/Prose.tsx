import type { RichBody } from "@/lib/sanity/types";
import { Container } from "../Container/Container";
import { Display } from "../Display/Display";
import { RichText } from "../RichText/RichText";
import { Section } from "../Section/Section";
import { Text } from "../Text/Text";
import styles from "./Prose.module.scss";

export type ProseProps = {
  title: string;
  /** e.g. "Last updated Nov 5, 2026". Hidden when empty. */
  meta?: string;
  body: RichBody;
};

/** A long-form page (privacy, terms): title, a meta line, then rich text in the narrow column. */
export function Prose({ title, meta, body }: ProseProps) {
  return (
    <Section>
      <Container width="narrow">
        <div className={styles.root}>
          <header className={styles.head}>
            <Display as="h1" size="m">
              {title}
            </Display>
            {meta ? (
              <Text size="meta" tone="ink-2">
                {meta}
              </Text>
            ) : null}
          </header>
          <RichText value={body} />
        </div>
      </Container>
    </Section>
  );
}
