import { Button } from "../Button/Button";
import { Container } from "../Container/Container";
import { Display } from "../Display/Display";
import { GuideLines } from "../GuideLines/GuideLines";
import { Logo } from "../Logo/Logo";
import { Section } from "../Section/Section";
import { Text } from "../Text/Text";
import styles from "./NotFoundMessage.module.scss";

export type NotFoundMessageProps = {
  /** Show the logo linking home: for the 404 that renders without the site header. */
  logo?: boolean;
};

/** The friendly 404: "Lost in space", a line of copy and a way back to the games. */
export function NotFoundMessage({ logo = false }: NotFoundMessageProps) {
  return (
    <Section>
      <Container width="narrow">
        <GuideLines>
          <div className={styles.root}>
            {logo ? <Logo size="s" href="/" /> : null}
            <Display as="h1" size="m">
              Lost in space
            </Display>
            <Text size="lead" tone="ink-2">
              We couldn&apos;t find that page. It may have moved, or it never existed.
            </Text>
            <Button variant="accent" href="/#games">
              Back to games
            </Button>
          </div>
        </GuideLines>
      </Container>
    </Section>
  );
}
