import { Container } from "../Container/Container";
import { Display } from "../Display/Display";
import { Section } from "../Section/Section";
import { Text } from "../Text/Text";
import styles from "./LegalEmpty.module.scss";

export type LegalEmptyProps = {
  title: string;
};

/** A calm placeholder for a legal page whose copy hasn't been published yet. */
export function LegalEmpty({ title }: LegalEmptyProps) {
  return (
    <Section>
      <Container width="narrow">
        <div className={styles.root}>
          <Display as="h1" size="m">
            {title}
          </Display>
          <Text tone="ink-2">This page is being written.</Text>
        </div>
      </Container>
    </Section>
  );
}
