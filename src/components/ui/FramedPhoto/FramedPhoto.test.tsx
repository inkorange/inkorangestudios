import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({ alt, src, fill, priority }: { alt: string; src: string; fill?: boolean; priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
    <img alt={alt} src={src} data-fill={String(Boolean(fill))} data-priority={String(Boolean(priority))} />
  ),
}));

import { FramedPhoto } from "./FramedPhoto";

it("renders the photo with its alt text", () => {
  render(<FramedPhoto photo={{ src: "/p.jpg", alt: "Chris at his desk", width: 800, height: 600 }} label="Studio photo" />);
  expect(screen.getByAltText("Chris at his desk")).toBeInTheDocument();
});
it("falls back to the labelled placeholder", () => {
  render(<FramedPhoto photo={null} label="Studio photo" />);
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.getByText("Studio photo")).toBeInTheDocument();
});
it("crops to 16:9 by default", () => {
  const { container } = render(<FramedPhoto photo={{ src: "/p.jpg", alt: "Photo", width: 800, height: 600 }} label="Photo" />);
  expect(container.firstElementChild).toHaveAttribute("data-shape", "wide");
  expect(screen.getByAltText("Photo")).toHaveAttribute("data-fill", "true");
  expect(screen.getByAltText("Photo")).toHaveAttribute("data-priority", "false");
});
it("keeps the photo's own proportions when natural, and can load first", () => {
  const { container } = render(<FramedPhoto photo={{ src: "/k.jpg", alt: "Key art", width: 2000, height: 1000 }} label="Key art" natural priority />);
  expect(container.firstElementChild).toHaveAttribute("data-shape", "natural");
  expect(screen.getByAltText("Key art")).toHaveAttribute("data-fill", "false");
  expect(screen.getByAltText("Key art")).toHaveAttribute("data-priority", "true");
});
it("a natural frame with no photo is still the 16:9 placeholder", () => {
  const { container } = render(<FramedPhoto photo={null} label="Key art" natural />);
  expect(container.firstElementChild).toHaveAttribute("data-shape", "wide");
});
