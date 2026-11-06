import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
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
