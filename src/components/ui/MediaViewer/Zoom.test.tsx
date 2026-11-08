import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { Media } from "@/lib/sanity/types";
import { MediaViewer } from "./MediaViewer";
import { MAX_SCALE, Zoom, zoomAt } from "./Zoom";

const shot = {
  src: "/tall.png",
  alt: "Aiming a launch",
  width: 1080,
  height: 2340,
};

function scaleOf(el: Element): number {
  return Number(
    (el.querySelector("[style]") as HTMLElement).style.getPropertyValue(
      "--zoom-scale",
    ),
  );
}

it("zooms around the given point, and recentres back at 1x", () => {
  expect(zoomAt({ scale: 1, x: 0, y: 0 }, 2, { x: 100, y: 50 })).toEqual({
    scale: 2,
    x: -100,
    y: -50,
  });
  expect(zoomAt({ scale: 2, x: -100, y: -50 }, 1, { x: 0, y: 0 })).toEqual({
    scale: 1,
    x: 0,
    y: 0,
  });
  expect(zoomAt({ scale: 1, x: 0, y: 0 }, 99, { x: 0, y: 0 }).scale).toBe(
    MAX_SCALE,
  );
  expect(zoomAt({ scale: 2, x: 0, y: 0 }, 0.1, { x: 0, y: 0 }).scale).toBe(1);
});

it("opens a screenshot full screen from the stage and closes again", () => {
  const items: Media[] = [{ kind: "image", label: "LAUNCH", image: shot }];
  render(<MediaViewer items={items} title="Space Cowboy" />);
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "View LAUNCH full screen" }),
  );
  const dialog = screen.getByRole("dialog", { hidden: true });
  expect(dialog).toHaveAttribute("aria-label", "LAUNCH, zoomed");
  fireEvent.click(screen.getByRole("button", { name: "Close", hidden: true }));
  expect(screen.queryByRole("dialog", { hidden: true })).toBeNull();
});

it("offers no full-screen view for the trailer", () => {
  const items: Media[] = [
    {
      kind: "trailer",
      label: "Trailer",
      poster: shot,
      url: "https://youtu.be/abc123",
    },
  ];
  render(<MediaViewer items={items} title="Space Cowboy" />);
  expect(screen.queryByRole("button", { name: /full screen/ })).toBeNull();
});

it("zooms with the buttons and the keyboard, within 1x to 5x", () => {
  const { container } = render(
    <Zoom image={shot} label="LAUNCH" onClose={vi.fn()} />,
  );
  const dialog = container.querySelector("dialog") as HTMLDialogElement;
  expect(scaleOf(dialog)).toBe(1);
  fireEvent.click(
    screen.getByRole("button", { name: "Zoom in", hidden: true }),
  );
  expect(scaleOf(dialog)).toBe(2);
  fireEvent.click(
    screen.getByRole("button", { name: "Zoom in", hidden: true }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Zoom in", hidden: true }),
  );
  expect(scaleOf(dialog)).toBe(MAX_SCALE);
  fireEvent.keyDown(dialog, { key: "0" });
  expect(scaleOf(dialog)).toBe(1);
  fireEvent.keyDown(dialog, { key: "+" });
  expect(scaleOf(dialog)).toBe(2);
  fireEvent.click(
    screen.getByRole("button", { name: "Zoom out", hidden: true }),
  );
  expect(scaleOf(dialog)).toBe(1);
});

function doubleTap(area: HTMLElement, start: number) {
  for (const t of [start, start + 100]) {
    fireEvent.pointerDown(area, { pointerId: 1, clientX: 10, clientY: 10, timeStamp: t });
    fireEvent.pointerUp(area, { pointerId: 1, clientX: 10, clientY: 10, timeStamp: t + 20 });
  }
}

it("zooms inside the stage on a double tap and back out on the next", () => {
  const items: Media[] = [{ kind: "image", label: "LAUNCH", image: shot }];
  const { container } = render(<MediaViewer items={items} title="Space Cowboy" />);
  const surface = container.querySelector("[data-zoomed]") as HTMLElement;
  expect(scaleOf(surface)).toBe(1);
  doubleTap(surface, 1000);
  expect(scaleOf(surface)).toBeGreaterThan(1);
  expect(surface).toHaveAttribute("data-zoomed", "true");
  expect(screen.queryByRole("dialog", { hidden: true })).toBeNull();
  doubleTap(surface, 3000);
  expect(scaleOf(surface)).toBe(1);
});

it("zooms the stage on Ctrl + wheel (trackpad pinch) but lets a plain wheel scroll the page", () => {
  const items: Media[] = [{ kind: "image", label: "LAUNCH", image: shot }];
  const { container } = render(<MediaViewer items={items} title="Space Cowboy" />);
  const surface = container.querySelector("[data-zoomed]") as HTMLElement;
  const plain = new WheelEvent("wheel", { deltaY: -100, cancelable: true, bubbles: true });
  act(() => {
    surface.dispatchEvent(plain);
  });
  expect(plain.defaultPrevented).toBe(false);
  expect(scaleOf(surface)).toBe(1);
  const pinch = new WheelEvent("wheel", { deltaY: -100, ctrlKey: true, cancelable: true, bubbles: true });
  act(() => {
    surface.dispatchEvent(pinch);
  });
  expect(pinch.defaultPrevented).toBe(true);
  expect(scaleOf(surface)).toBeGreaterThan(1);
});

it("zooms in on a double tap and back out on the next", () => {
  const { container } = render(
    <Zoom image={shot} label="LAUNCH" onClose={vi.fn()} />,
  );
  const dialog = container.querySelector("dialog") as HTMLDialogElement;
  const area = dialog.firstElementChild as HTMLElement;
  const tapAt = (t: number) => {
    fireEvent.pointerDown(area, {
      pointerId: 1,
      clientX: 10,
      clientY: 10,
      timeStamp: t,
    });
    fireEvent.pointerUp(area, {
      pointerId: 1,
      clientX: 10,
      clientY: 10,
      timeStamp: t + 20,
    });
  };
  tapAt(1000);
  tapAt(1100);
  expect(scaleOf(dialog)).toBeGreaterThan(1);
  tapAt(3000);
  tapAt(3100);
  expect(scaleOf(dialog)).toBe(1);
});
