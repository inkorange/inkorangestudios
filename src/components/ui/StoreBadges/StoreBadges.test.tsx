import { render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import { StoreBadges } from "./StoreBadges";

const play = { platform: "Android", href: "https://play.google.com/store/apps/details?id=x" } as const;
const apple = { platform: "iOS", href: "https://apps.apple.com/app/id1" } as const;
const web = { platform: "Web", href: "https://play.example.com" } as const;

it("shows the official badges as links that open in a new tab, Web skipped", () => {
  render(<StoreBadges stores={[play, apple, web]} label="App stores" />);
  const list = screen.getByRole("list", { name: "App stores" });
  const links = within(list).getAllByRole("link");
  expect(links.map((a) => a.getAttribute("href"))).toEqual([play.href, apple.href]);
  for (const a of links) {
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveAttribute("rel", "noopener noreferrer");
  }
  expect(within(links[0]).getByRole("img", { name: "Get it on Google Play" })).toHaveAttribute("src", "/badges/google-play.png");
  expect(within(links[1]).getByRole("img", { name: "Download on the App Store" })).toHaveAttribute("src", "/badges/app-store.svg");
});

it("renders nothing without an app store link", () => {
  const { container } = render(<StoreBadges stores={[web]} label="App stores" />);
  expect(container).toBeEmptyDOMElement();
});

it("takes a size", () => {
  render(<StoreBadges stores={[play]} label="TerraForge in the app stores" size="s" />);
  expect(screen.getByRole("list", { name: "TerraForge in the app stores" })).toHaveAttribute("data-size", "s");
});
