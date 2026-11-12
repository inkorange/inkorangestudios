import Image from "next/image";
import { statusLabel } from "@/lib/games";
import type { Tool } from "@/lib/sanity/types";
import { Button } from "../Button/Button";
import { Chip } from "../Chip/Chip";
import { Heading } from "../Heading/Heading";
import { Placeholder } from "../Placeholder/Placeholder";
import { Text } from "../Text/Text";
import styles from "./ToolCard.module.scss";

export type ToolCardProps = {
  tool: Tool;
  /** `h3` under a section heading (home), `h2` directly under the page title (/learn). */
  headingLevel?: "h2" | "h3";
};

/**
 * A free educational tool: banner with a status chip, name, summary, a "Try it free" button (once the tool
 * is out) that opens it in a new tab, and any extra links (articles, videos) about it.
 */
export function ToolCard({ tool, headingLevel = "h3" }: ToolCardProps) {
  const { name, status, summary, url, image, links } = tool;
  // Only a released tool gets the button (and a linked banner); one still on the way just shows its status.
  const open = status === "out-now" && url ? url : null;
  const art = image ? (
    <Image className={styles.image} src={image.src} alt="" fill sizes="(min-width: 1024px) 640px, 100vw" />
  ) : (
    <Placeholder radius="none" label={name} />
  );
  return (
    <article className={styles.root}>
      <div className={styles.media}>
        {/* The banner opens the tool too; hidden from keyboards and screen readers, which get the button. */}
        {open ? (
          <a className={styles.banner} href={open} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true">
            {art}
          </a>
        ) : (
          art
        )}
        <span className={styles.chip}>
          <Chip tone={status === "out-now" ? "accent" : "ink"} size="s">
            {statusLabel(status)}
          </Chip>
        </span>
      </div>
      <div className={styles.body}>
        <Heading as={headingLevel} size="title-s">
          {name}
        </Heading>
        {summary ? <Text tone="ink-2">{summary}</Text> : null}
        {open ? (
          <div className={styles.actions}>
            <Button variant="accent" href={open} external>
              Try it free
              <span className={styles.hidden}>
                : {name} (opens in a new tab)
              </span>
            </Button>
          </div>
        ) : null}
        {links.length > 0 ? (
          <ul className={styles.links} role="list" aria-label={`More about ${name}`}>
            {links.map((link) => (
              <li key={link.href}>
                <a className={styles.link} href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                  <span aria-hidden="true">↗</span>
                  <span className={styles.hidden}> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
