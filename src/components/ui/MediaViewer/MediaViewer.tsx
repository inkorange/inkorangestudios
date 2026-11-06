"use client";

import Image from "next/image";
import { useState } from "react";
import type { Media } from "@/lib/sanity/types";
import { isAbsoluteUrl, parseVideo } from "@/lib/video";
import { Icon } from "../Icon/Icon";
import { Placeholder } from "../Placeholder/Placeholder";
import styles from "./MediaViewer.module.scss";

export type MediaViewerProps = {
  items: Media[];
  title: string;
};

function Stage({ item, title, playing, onPlay }: { item: Media; title: string; playing: boolean; onPlay: () => void }) {
  if (item.kind === "image") {
    return (
      <figure className={styles.stage}>
        {item.image ? (
          <Image className={styles.fill} src={item.image.src} alt={item.image.alt} width={item.image.width} height={item.image.height} sizes="(min-width: 1024px) 1320px, 100vw" />
        ) : (
          <div className={styles.fill} aria-hidden="true">
            <Placeholder tone="dark" radius="none" />
          </div>
        )}
        <figcaption className={styles.caption}>{item.label}</figcaption>
      </figure>
    );
  }

  const parsed = parseVideo(item.url);
  const source = playing && parsed.kind !== "unsupported" ? parsed : null;
  return (
    <figure className={styles.stage}>
      {source?.kind === "embed" ? (
        <iframe className={styles.fill} src={source.src} title={`${title} trailer`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
      ) : source ? (
        <video className={styles.fill} src={source.src} controls autoPlay poster={item.poster?.src} />
      ) : (
        <>
          {item.poster ? (
            <Image className={styles.fill} src={item.poster.src} alt="" width={item.poster.width} height={item.poster.height} sizes="(min-width: 1024px) 1320px, 100vw" priority />
          ) : (
            <div className={styles.fill} aria-hidden="true">
              <Placeholder tone="dark" radius="none" />
            </div>
          )}
          <span className={styles.scrim} aria-hidden="true" />
          {parsed.kind === "unsupported" ? (
            isAbsoluteUrl(item.url.trim()) ? (
              <a className={styles.watch} href={item.url.trim()} target="_blank" rel="noopener noreferrer">
                Watch the trailer
              </a>
            ) : null
          ) : (
            <button type="button" className={styles.play} onClick={onPlay} aria-label={`Play the ${title} trailer`}>
              <Icon name="play" size={34} />
            </button>
          )}
          <figcaption className={styles.caption}>{item.duration ? `OFFICIAL TRAILER · ${item.duration}` : "OFFICIAL TRAILER"}</figcaption>
        </>
      )}
    </figure>
  );
}

function ThumbArt({ item }: { item: Media }) {
  const art = item.kind === "trailer" ? item.poster : item.image;
  if (!art) return null;
  return <Image className={styles["thumb-image"]} src={art.src} alt="" width={art.width} height={art.height} sizes="150px" />;
}

export function MediaViewer({ items, title }: MediaViewerProps) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  if (items.length === 0) return null;
  const current = items[Math.min(index, items.length - 1)];

  function select(i: number) {
    if (i === index) return;
    setIndex(i);
    // Leaving the stage stops playback; coming back shows the poster again.
    setPlaying(false);
  }

  return (
    <section className={styles.root} aria-label="Trailer and screenshots">
      <Stage key={index} item={current} title={title} playing={playing} onPlay={() => setPlaying(true)} />
      {items.length > 1 ? (
        <div className={styles.thumbs}>
          {items.map((item, i) => (
            <button key={`${i}-${item.label}`} type="button" className={styles.thumb} aria-label={`Show ${item.label}`} aria-pressed={i === index} onClick={() => select(i)}>
              <ThumbArt item={item} />
              <span className={styles["thumb-label"]} aria-hidden="true">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
