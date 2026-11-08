"use client";

import Image from "next/image";
import {
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ImageRef } from "@/lib/sanity/types";
import { IconButton } from "../IconButton/IconButton";
import styles from "./MediaViewer.module.scss";

export const MIN_SCALE = 1;
export const MAX_SCALE = 5;
/** How far a button press or a key zooms. */
const STEP = 2;
/** Where a double tap zooms to. */
const DOUBLE_TAP_SCALE = 2.5;
/** Two taps this close together (ms) and this still (px) are a double tap. */
const DOUBLE_TAP_MS = 300;
const TAP_SLOP = 10;

export type View = { scale: number; x: number; y: number };
type Point = { x: number; y: number };

const START: View = { scale: MIN_SCALE, x: 0, y: 0 };

function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/**
 * Zoom to `scale`, keeping the picture point under `at` (relative to the area's centre) still.
 * Back at 1x the picture recentres.
 */
export function zoomAt(view: View, scale: number, at: Point): View {
  const next = clampScale(scale);
  if (next === MIN_SCALE) return START;
  const k = next / view.scale;
  return {
    scale: next,
    x: at.x - (at.x - view.x) * k,
    y: at.y - (at.y - view.y) * k,
  };
}

/** Keep the zoomed picture from being dragged entirely out of the area. */
function clampPan(view: View, box: { width: number; height: number }): View {
  const maxX = (box.width * (view.scale - 1)) / 2;
  const maxY = (box.height * (view.scale - 1)) / 2;
  return {
    ...view,
    x: Math.min(maxX, Math.max(-maxX, view.x)),
    y: Math.min(maxY, Math.max(-maxY, view.y)),
  };
}

/** A client point relative to the element's centre. */
function centreOffset(el: Element | null, p: Point): Point {
  const r = el?.getBoundingClientRect();
  if (!r) return { x: 0, y: 0 };
  return { x: p.x - (r.left + r.width / 2), y: p.y - (r.top + r.height / 2) };
}

function boundedIn(el: Element | null, view: View): View {
  const r = el?.getBoundingClientRect();
  return r ? clampPan(view, r) : view;
}

/**
 * Pinch, double tap, drag and wheel zooming for one area. `wheel: "always"` zooms on any wheel
 * (the full-screen view); `"pinch"` only on a trackpad pinch or Ctrl + wheel, so scrolling over
 * the stage still scrolls the page.
 */
export function useZoomPan(
  area: RefObject<HTMLElement | null>,
  wheel: "always" | "pinch",
) {
  const [view, setView] = useState<View>(START);
  const [gesture, setGesture] = useState(false);
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<{ distance: number; view: View } | null>(null);
  const tap = useRef<{ time: number; at: Point; moved: boolean }>({
    time: 0,
    at: { x: 0, y: 0 },
    moved: false,
  });

  // Read the area's box at event time (never during render).
  const fromCentre = (p: Point): Point => centreOffset(area.current, p);
  const bounded = (next: View): View => boundedIn(area.current, next);

  // Wheel zoom needs a non-passive listener so it can stop the page scrolling underneath.
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const target = el;
    function onWheel(e: WheelEvent) {
      if (wheel === "pinch" && !e.ctrlKey) return;
      e.preventDefault();
      const at = centreOffset(target, { x: e.clientX, y: e.clientY });
      // A trackpad pinch sends small deltas; a mouse wheel large ones.
      const speed = e.ctrlKey ? 0.01 : 0.002;
      setView((v) =>
        boundedIn(target, zoomAt(v, v.scale * Math.exp(-e.deltaY * speed), at)),
      );
    }
    target.addEventListener("wheel", onWheel, { passive: false });
    return () => target.removeEventListener("wheel", onWheel);
  }, [area, wheel]);

  function onPointerDown(e: PointerEvent<HTMLElement>) {
    // Mouse: left button only.
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (pointers.current.size === 0)
      tap.current = {
        ...tap.current,
        at: { x: e.clientX, y: e.clientY },
        moved: false,
      };
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setGesture(true);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), view };
      tap.current.moved = true;
    }
  }

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    const last = pointers.current.get(e.pointerId);
    if (!last) return;
    const now = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, now);
    const start = tap.current.at;
    if (Math.hypot(now.x - start.x, now.y - start.y) > TAP_SLOP)
      tap.current.moved = true;
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = fromCentre({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      const base = pinch.current;
      setView(
        bounded(
          zoomAt(base.view, base.view.scale * (distance / base.distance), mid),
        ),
      );
      return;
    }
    if (pointers.current.size === 1 && view.scale > MIN_SCALE) {
      setView(
        bounded({
          ...view,
          x: view.x + now.x - last.x,
          y: view.y + now.y - last.y,
        }),
      );
    }
  }

  function onPointerUp(e: PointerEvent<HTMLElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    const wasSingle = pointers.current.size === 1;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) setGesture(false);
    if (!wasSingle || tap.current.moved || e.type === "pointercancel") {
      tap.current.time = 0;
      return;
    }
    const at = { x: e.clientX, y: e.clientY };
    const prev = tap.current;
    const double =
      e.timeStamp - prev.time < DOUBLE_TAP_MS &&
      Math.hypot(at.x - prev.at.x, at.y - prev.at.y) < TAP_SLOP * 3;
    if (double) {
      tap.current.time = 0;
      setView(
        view.scale > MIN_SCALE
          ? START
          : bounded(zoomAt(view, DOUBLE_TAP_SCALE, fromCentre(at))),
      );
    } else {
      tap.current = { time: e.timeStamp, at, moved: false };
    }
  }

  const step = (dir: 1 | -1) =>
    setView((v) =>
      boundedIn(
        area.current,
        zoomAt(v, dir > 0 ? v.scale * STEP : v.scale / STEP, { x: 0, y: 0 }),
      ),
    );
  const reset = () => setView(START);

  return {
    view,
    gesture,
    zoomed: view.scale > MIN_SCALE,
    step,
    reset,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
}

/**
 * A full-screen view of one screenshot: pinch or scroll to zoom, drag to pan, double tap to
 * zoom in and back out. A modal `dialog`, so Escape closes it and focus stays inside.
 */
export function Zoom({
  image,
  label,
  onClose,
}: {
  image: NonNullable<ImageRef>;
  label: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const { view, gesture, zoomed, step, reset, handlers } = useZoomPan(
    area,
    "always",
  );

  // Open as a modal on mount. No close() on cleanup: unmounting removes the dialog anyway, and a
  // close() there fires the close event, which (with React's dev double-mount) shut it at once.
  useEffect(() => {
    const d = dialog.current;
    if (d && typeof d.showModal === "function" && !d.open) d.showModal();
  }, []);

  function onKeyDown(e: KeyboardEvent<HTMLDialogElement>) {
    if (e.key === "+" || e.key === "=") step(1);
    else if (e.key === "-" || e.key === "_") step(-1);
    else if (e.key === "0") reset();
  }

  return (
    <dialog
      ref={dialog}
      className={styles.zoom}
      aria-label={`${label}, zoomed`}
      onClose={onClose}
      onKeyDown={onKeyDown}
    >
      <div
        ref={area}
        className={styles["zoom-area"]}
        data-gesture={gesture}
        data-zoomed={zoomed}
        {...handlers}
      >
        <div
          className={styles["zoom-picture"]}
          style={{
            "--zoom-x": `${view.x}px`,
            "--zoom-y": `${view.y}px`,
            "--zoom-scale": `${view.scale}`,
          }}
        >
          <Image
            className={styles["zoom-image"]}
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            unoptimized
            draggable={false}
          />
        </div>
      </div>
      <div className={styles["zoom-controls"]}>
        <IconButton
          icon="minus"
          label="Zoom out"
          tone="dark"
          onClick={() => step(-1)}
        />
        <IconButton
          icon="plus"
          label="Zoom in"
          tone="dark"
          onClick={() => step(1)}
        />
        <IconButton icon="close" label="Close" tone="dark" onClick={onClose} />
      </div>
    </dialog>
  );
}
