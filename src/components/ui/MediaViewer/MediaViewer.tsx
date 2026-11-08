"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ImageRef, Media } from "@/lib/sanity/types";
import { isAbsoluteUrl, parseVideo } from "@/lib/video";
import { Heading } from "../Heading/Heading";
import { Icon } from "../Icon/Icon";
import { Placeholder } from "../Placeholder/Placeholder";
import { Zoom, useZoomPan } from "./Zoom";
import styles from "./MediaViewer.module.scss";

export type MediaViewerProps = {
  items: Media[];
  title: string;
};

/** The item's picture: the screenshot, or the trailer's poster. */
function artOf(item: Media): ImageRef {
  return item.kind === "trailer" ? item.poster : item.image;
}

/** Taller than wide: a phone screenshot held upright. */
function isPortrait(art: ImageRef): boolean {
  return Boolean(art && art.height > art.width);
}

/** The section's visible name, after what it holds. */
export function mediaHeading(items: Media[]): string {
  const trailer = items.some((item) => item.kind === "trailer");
  const shots = items.some((item) => item.kind === "image");
  if (trailer && shots) return "Trailer and screenshots";
  return trailer ? "Trailer" : "Screenshots";
}

/** Shown on the stage until its picture has loaded, so switching thumbs never shows an empty frame. */
function Loading() {
  return (
    <span className={styles.loading} role="status">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles["loading-text"]}>Loading</span>
    </span>
  );
}

function Stage({
  item,
  title,
  playing,
  onPlay,
}: {
  item: Media;
  title: string;
  playing: boolean;
  onPlay: () => void;
}) {
  // The stage remounts for each item (keyed by index), so these reset on every switch.
  const [loaded, setLoaded] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const surface = useRef<HTMLDivElement>(null);
  const zoom = useZoomPan(surface, "pinch");
  const done = () => setLoaded(true);
  if (item.kind === "image") {
    // Screenshots are shown whole (any shape) over a blurred copy of themselves that fills the stage.
    // Pinch, double tap or Ctrl + wheel zooms right here; the corner button opens the full-screen view.
    return (
      <figure
        className={styles.stage}
        data-fit="contain"
        data-orientation={isPortrait(item.image) ? "portrait" : "landscape"}
        data-loaded={loaded || !item.image}
      >
        {item.image ? (
          <>
            <Image
              className={styles.backdrop}
              src={item.image.src}
              alt=""
              aria-hidden="true"
              width={item.image.width}
              height={item.image.height}
              sizes="(min-width: 1024px) 1320px, 100vw"
            />
            <div
              ref={surface}
              className={styles.surface}
              data-zoomed={zoom.zoomed}
              data-gesture={zoom.gesture}
              {...zoom.handlers}
            >
              <div
                className={styles.pan}
                style={{
                  "--zoom-x": `${zoom.view.x}px`,
                  "--zoom-y": `${zoom.view.y}px`,
                  "--zoom-scale": `${zoom.view.scale}`,
                }}
              >
                <Image
                  className={styles.fill}
                  src={item.image.src}
                  alt={item.image.alt}
                  width={item.image.width}
                  height={item.image.height}
                  sizes="(min-width: 1024px) 1320px, 100vw"
                  onLoad={done}
                  onError={done}
                  draggable={false}
                />
              </div>
            </div>
            {loaded ? null : <Loading />}
            <button
              type="button"
              className={styles["zoom-open"]}
              aria-label={`View ${item.label} full screen`}
              onClick={() => setFullScreen(true)}
            >
              <Icon name="expand" size={20} />
            </button>
            {fullScreen ? (
              <Zoom
                image={item.image}
                label={item.label}
                onClose={() => setFullScreen(false)}
              />
            ) : null}
          </>
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
    <figure
      className={styles.stage}
      data-loaded={loaded || !item.poster || Boolean(source)}
    >
      {source?.kind === "embed" ? (
        <iframe
          className={styles.fill}
          src={source.src}
          title={`${title} trailer`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      ) : source ? (
        <video
          className={styles.fill}
          src={source.src}
          controls
          autoPlay
          poster={item.poster?.src}
        />
      ) : (
        <>
          {item.poster ? (
            <>
              <Image
                className={styles.fill}
                src={item.poster.src}
                alt=""
                width={item.poster.width}
                height={item.poster.height}
                sizes="(min-width: 1024px) 1320px, 100vw"
                priority
                onLoad={done}
                onError={done}
              />
              {loaded ? null : <Loading />}
            </>
          ) : (
            <div className={styles.fill} aria-hidden="true">
              <Placeholder tone="dark" radius="none" />
            </div>
          )}
          <span className={styles.scrim} aria-hidden="true" />
          {parsed.kind === "unsupported" ? (
            isAbsoluteUrl(item.url.trim()) ? (
              <a
                className={styles.watch}
                href={item.url.trim()}
                target="_blank"
                rel="noopener noreferrer"
              >
                Watch the trailer
              </a>
            ) : null
          ) : (
            <button
              type="button"
              className={styles.play}
              onClick={onPlay}
              aria-label={`Play the ${title} trailer`}
            >
              <Icon name="play" size={34} />
            </button>
          )}
          <figcaption className={styles.caption}>
            {item.duration
              ? `OFFICIAL TRAILER · ${item.duration}`
              : "OFFICIAL TRAILER"}
          </figcaption>
        </>
      )}
    </figure>
  );
}

function ThumbArt({ item }: { item: Media }) {
  const art = artOf(item);
  if (!art) return null;
  return (
    <Image
      className={styles["thumb-image"]}
      src={art.src}
      alt=""
      width={art.width}
      height={art.height}
      sizes="150px"
    />
  );
}

/**
 * How many thumbs are out of view (wholly or partly) past the end of the scrolling strip or rail, and which
 * way it scrolls. Updates on scroll and resize.
 */
function useMoreHint() {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState<{ count: number; axis: "x" | "y" }>({
    count: 0,
    axis: "y",
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function measure() {
      if (!el) return;
      const vertical = el.scrollHeight > el.clientHeight + 1;
      const horizontal = !vertical && el.scrollWidth > el.clientWidth + 1;
      if (!vertical && !horizontal) {
        setMore((m) => (m.count === 0 ? m : { count: 0, axis: m.axis }));
        return;
      }
      const box = el.getBoundingClientRect();
      const edge = vertical ? box.bottom : box.right;
      let count = 0;
      for (const child of el.children) {
        const r = child.getBoundingClientRect();
        // Partly cut off counts too: the viewer can't see all of it.
        if ((vertical ? r.bottom : r.right) > edge + 1) count++;
      }
      const axis = vertical ? "y" : "x";
      setMore((m) =>
        m.count === count && m.axis === axis ? m : { count, axis },
      );
    }
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    observer?.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      observer?.disconnect();
    };
  }, []);
  return { ref, ...more };
}

export function MediaViewer({ items, title }: MediaViewerProps) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const { ref: thumbsRef, count: moreCount, axis: moreAxis } = useMoreHint();
  if (items.length === 0) return null;
  const current = items[Math.min(index, items.length - 1)];
  const heading = mediaHeading(items);
  const anyPortrait = items.some((item) => isPortrait(artOf(item)));

  function select(i: number) {
    if (i === index) return;
    setIndex(i);
    // Leaving the stage stops playback; coming back shows the poster again.
    setPlaying(false);
  }

  return (
    <section
      className={styles.root}
      aria-label={heading}
      data-rail={items.length > 1}
    >
      <div className={styles.heading}>
        <Heading as="h2" size="m">
          {heading}
        </Heading>
      </div>
      <Stage
        key={index}
        item={current}
        title={title}
        playing={playing}
        onPlay={() => setPlaying(true)}
      />
      {items.length > 1 ? (
        <div className={styles.rail}>
          <div
            ref={thumbsRef}
            className={styles.thumbs}
            data-tall={anyPortrait}
          >
            {items.map((item, i) => {
              const art = artOf(item);
              const portrait = isPortrait(art);
              return (
                <button
                  key={`${i}-${item.label}`}
                  type="button"
                  className={styles.thumb}
                  data-orientation={portrait ? "portrait" : "landscape"}
                  // Each thumb takes its picture's own shape, so nothing is cropped away.
                  style={{
                    "--thumb-ratio": art
                      ? `${art.width} / ${art.height}`
                      : undefined,
                  }}
                  aria-label={`Show ${item.label}`}
                  aria-pressed={i === index}
                  onClick={() => select(i)}
                >
                  <ThumbArt item={item} />
                  {portrait ? null : (
                    <span className={styles["thumb-label"]} aria-hidden="true">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {moreCount > 0 ? (
            <span
              className={styles["more-hint"]}
              data-axis={moreAxis}
              aria-hidden="true"
            >
              {moreCount} more {moreAxis === "y" ? "↓" : "→"}
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
