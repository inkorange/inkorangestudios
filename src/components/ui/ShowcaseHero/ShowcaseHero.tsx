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
  // The list can shrink under a kept index (e.g. after revalidation); clamp instead of falling back.
  const current = Math.min(index, count - 1);
  const active = games[current];

  function go(to: number) {
    const target = (to + count) % count;
    setIndex(target);
    setAnnouncement(games[target].name);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!multiple || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowRight") go(current + 1);
    else if (event.key === "ArrowLeft") go(current - 1);
  }

  const external = /^https?:\/\//.test(active.cta.href);

  return (
    <section
      className={styles.root}
      aria-roledescription={multiple ? "carousel" : undefined}
      aria-label="Featured games"
      onKeyDown={multiple ? onKeyDown : undefined}
    >
      <div className={styles.card}>
        <div
          className={styles.slide}
          role={multiple ? "group" : undefined}
          aria-roledescription={multiple ? "slide" : undefined}
          aria-label={multiple ? `${current + 1} of ${count}` : undefined}
        >
          <div className={styles.art}>
            {active.art ? (
              <Image
                key={active.slug}
                className={styles.image}
                src={active.art.src}
                alt={active.art.alt}
                fill
                sizes="(min-width: 1024px) 56vw, 100vw"
                priority={current === 0}
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
            <Display as="h1" size="hero" tone="on-dark">
              {active.name}
            </Display>
            <Text size="body-l" tone="on-dark-2">
              {active.blurb}
            </Text>
            <div className={styles.actions}>
              <Button variant="accent" size="l" href={active.cta.href} external={external}>
                {active.cta.label}
              </Button>
              <Button variant="outline-on-dark" size="l" href={active.detailHref}>
                Game details
              </Button>
            </div>

            {multiple ? (
              <div className={styles.controls}>
                <IconButton icon="chevron-left" label="Previous featured game" tone="dark" onClick={() => go(current - 1)} />
                <div className={styles.dots}>
                  {games.map((game, i) => (
                    <button
                      key={game.slug}
                      type="button"
                      className={styles.dot}
                      aria-label={`Show ${game.name}`}
                      aria-current={i === current ? "true" : undefined}
                      onClick={() => go(i)}
                    >
                      <span className={styles.pip} />
                    </button>
                  ))}
                </div>
                <IconButton icon="chevron-right" label="Next featured game" tone="dark" onClick={() => go(current + 1)} />
                <span className={styles.counter}>{`${pad(current + 1)} / ${pad(count)}`}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {multiple ? (
        <>
          <div className={styles.live} aria-live="polite">
            {announcement}
          </div>
          <SpotlightRail games={games} activeIndex={current} onPick={go} />
        </>
      ) : null}
    </section>
  );
}
