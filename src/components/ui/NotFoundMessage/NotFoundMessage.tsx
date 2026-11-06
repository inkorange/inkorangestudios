import type { ReactNode } from "react";
import { Button } from "../Button/Button";
import { Container } from "../Container/Container";
import { Display } from "../Display/Display";
import { GuideLines } from "../GuideLines/GuideLines";
import { Logo } from "../Logo/Logo";
import { Section } from "../Section/Section";
import { Text } from "../Text/Text";
import styles from "./NotFoundMessage.module.scss";

export type NotFoundMessageProps = {
  /** Show the logo linking home: for pages that render without the site header. */
  logo?: boolean;
  /** Defaults to "Lost in space". */
  title?: string;
  /** Defaults to the 404 line. */
  message?: string;
  /** Defaults to the "Back to games" button. */
  action?: ReactNode;
};

/** The friendly 404 ("Lost in space", a line of copy and a way back to the games); the error page reuses it with its own copy and a retry button. */
export function NotFoundMessage({
  logo = false,
  title = "Lost in space",
  message = "We couldn't find that page. It may have moved, or it never existed.",
  action,
}: NotFoundMessageProps) {
  return (
    <Section>
      <Container width="narrow">
        <GuideLines>
          <div className={styles.root}>
            {logo ? <Logo size="s" href="/" /> : null}
            <Display as="h1" size="m">
              {title}
            </Display>
            <Text size="lead" tone="ink-2">
              {message}
            </Text>
            {action ?? (
              <Button variant="accent" href="/#games">
                Back to games
              </Button>
            )}
          </div>
        </GuideLines>
      </Container>
    </Section>
  );
}
