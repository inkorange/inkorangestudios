"use client";

import Image from "next/image";
import { useState, type KeyboardEvent } from "react";
import { statusLabel } from "@/lib/games";
import type { Featured } from "@/lib/sanity/types";
import { Button } from "../Button/Button";
import { Chip } from "../Chip/Chip";
import { Display } from "../Display/Display";
import { IconButton } from "../IconButton/IconButton";
import { Placeholder } from "../Placeholder/Placeholder";
import { SpotlightRail } from "../SpotlightRail/SpotlightRail";
import { Text } from "../Text/Text";
import styles from "./ShowcaseHero.module.scss";

export type ShowcaseHeroProps = {
  games: Featured[];
};

const pad = (n: number) => String(n).padStart(2, "0");

export function ShowcaseHero({ games }: ShowcaseHeroProps) {
  const [index, setIndex] = useState(0);
  // Set only when the user changes slides, so nothing is announced on first render.
  const [announcement, setAnnouncement] = useState("");

  if (games.length === 0) return null;

  const count = games.length;
  const multiple = count > 1;
  const active = games[index] ?? games[0];

  function go(to: number) {
    const target = (to + count) % count;
    setIndex(target);
    setAnnouncement(games[target].name);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!multiple) return;
    if (event.key === "ArrowRight") go(index + 1);
    else if (event.key === "ArrowLeft") go(index - 1);
  }

  return (
    <section className={styles.root} aria-roledescription="carousel" aria-label="Featured games" onKeyDown={onKeyDown}>
      <div className={styles.card}>
        <div className={styles.slide} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${count}`}>
          <div className={styles.art}>
            {active.art ? (
              <Image
                key={active.slug}
                className={styles.image}
                src={active.art.src}
                alt={active.art.alt}
                fill
                sizes="(min-width: 1024px) 56vw, 100vw"
                priority={index === 0}
              />
            ) : (
              <Placeholder tone="dark" radius="none" />
            )}
            <span className={styles.flag}>
              <Chip tone="accent">{statusLabel(active.status)}</Chip>
            </span>
          </div>

          <div className={styles.body}>
            <div className={styles.chips}>
              <Chip tone="accent">{statusLabel(active.status)}</Chip>
              <Chip tone="outline-on-dark">{active.genre}</Chip>
              <Chip tone="plain-on-dark">{active.platformLabel}</Chip>
            </div>
            <p className={styles.meta}>{`${active.genre} · ${active.platformLabel}`}</p>
            <Display as="h1" size="xl" tone="on-dark">
              {active.name}
            </Display>
            <Text size="body-l" tone="on-dark-2">
              {active.blurb}
            </Text>
            <div className={styles.actions}>
              <Button variant="accent" size="l" href={active.cta.href} external={/^https?:\/\//.test(active.cta.href)}>
                {active.cta.label}
              </Button>
              <Button variant="outline-on-dark" size="l" href={active.detailHref}>
                Game details
              </Button>
            </div>

            {multiple ? (
              <div className={styles.controls}>
                <IconButton icon="chevron-left" label="Previous featured game" tone="dark" onClick={() => go(index - 1)} />
                <span className={styles.counter}>{`${pad(index + 1)} / ${pad(count)}`}</span>
                <div className={styles.dots}>
                  {games.map((game, i) => (
                    <button
                      key={game.slug}
                      type="button"
                      className={styles.dot}
                      aria-label={`Show ${game.name}`}
                      aria-current={i === index ? "true" : undefined}
                      onClick={() => go(i)}
                    >
                      <span className={styles.pip} />
                    </button>
                  ))}
                </div>
                <IconButton icon="chevron-right" label="Next featured game" tone="dark" onClick={() => go(index + 1)} />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles.live} aria-live="polite">
        {announcement}
      </div>

      {multiple ? <SpotlightRail games={games} activeIndex={index} onPick={go} /> : null}
    </section>
  );
}
