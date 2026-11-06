import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import type { Media } from "@/lib/sanity/types";
import { MediaViewer } from "./MediaViewer";

const items: Media[] = [
  { kind: "trailer", label: "TRAILER", poster: null, url: "https://youtu.be/abc123", duration: "1:30" },
  { kind: "image", label: "PLANET EDITOR", image: null },
  { kind: "image", label: "STAR SYSTEM", image: { src: "/s.png", alt: "A star system", width: 800, height: 400 } },
];

it("renders nothing without items", () => {
  const { container } = render(<MediaViewer items={[]} title="TerraForge" />);
  expect(container).toBeEmptyDOMElement();
});

it("shows a labelled play button and no iframe until pressed", () => {
  const { container } = render(<MediaViewer items={items} title="TerraForge" />);
  expect(container.querySelector("iframe")).toBeNull();
  expect(container.querySelector("video")).toBeNull();
  expect(screen.getByText(/OFFICIAL TRAILER · 1:30/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Play the TerraForge trailer" }));
  const frame = container.querySelector("iframe");
  expect(frame).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/abc123?autoplay=1");
  expect(frame).toHaveAttribute("title", "TerraForge trailer");
  expect(frame).toHaveAttribute("allow", "autoplay; fullscreen; picture-in-picture");
});

it("plays direct files in a video element", () => {
  const direct: Media[] = [{ kind: "trailer", label: "TRAILER", poster: null, url: "https://cdn.example.com/t.mp4" }];
  const { container } = render(<MediaViewer items={direct} title="TerraForge" />);
  fireEvent.click(screen.getByRole("button", { name: "Play the TerraForge trailer" }));
  const video = container.querySelector("video");
  expect(video).toHaveAttribute("src", "https://cdn.example.com/t.mp4");
  expect(video).toHaveAttribute("controls");
});

it("selects a thumbnail and shows its label on the stage", () => {
  render(<MediaViewer items={items} title="TerraForge" />);
  expect(screen.getByRole("button", { name: "Show TRAILER" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Show PLANET EDITOR" }));
  expect(within(screen.getByRole("figure")).getByText("PLANET EDITOR")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Show PLANET EDITOR" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Show TRAILER" })).toHaveAttribute("aria-pressed", "false");
  expect(screen.queryByRole("button", { name: /Play the/ })).toBeNull();
});

it("returning to the trailer resets playback", () => {
  const { container } = render(<MediaViewer items={items} title="TerraForge" />);
  fireEvent.click(screen.getByRole("button", { name: "Play the TerraForge trailer" }));
  fireEvent.click(screen.getByRole("button", { name: "Show STAR SYSTEM" }));
  expect(container.querySelector("iframe")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Show TRAILER" }));
  expect(container.querySelector("iframe")).toBeNull();
});
