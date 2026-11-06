import { render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import { StoreCard } from "./StoreCard";

it("renders only the eyebrow and primary button when sparse", () => {
  const { container } = render(<StoreCard primary={{ label: "Play in browser", href: "https://example.com" }} facts={[]} />);
  expect(screen.getByText("GET THE GAME")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Play in browser" })).toHaveAttribute("target", "_blank");
  expect(container.querySelector("dl")).toBeNull();
  expect(container.querySelector("details")).toBeNull();
  expect(screen.queryByText(/Game details/)).toBeNull();
});

it("renders without a primary action", () => {
  render(<StoreCard primary={null} facts={[]} />);
  expect(screen.queryByRole("link")).toBeNull();
  expect(screen.getByText("GET THE GAME")).toBeInTheDocument();
});

it("shows price, notify box and facts when given", () => {
  const { container } = render(
    <StoreCard
      priceLabel="Free"
      primary={{ label: "Play", href: "/play" }}
      notifyTitle="Android · coming soon"
      notify={<form aria-label="notify" />}
      facts={[{ label: "Genre", value: "Sandbox" }]}
    />,
  );
  expect(screen.getByText("Free")).toBeInTheDocument();
  expect(screen.getByText("Android · coming soon")).toBeInTheDocument();
  expect(screen.getByRole("form", { name: "notify" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Play" })).not.toHaveAttribute("target");
  // both renderings exist; CSS picks one
  expect(container.querySelectorAll("dl")).toHaveLength(2);
  expect(container.querySelector("details summary")).toHaveTextContent("Game details");
});

it("can leave the phone fact accordion to the page", () => {
  const { container } = render(<StoreCard primary={null} facts={[{ label: "Genre", value: "Sandbox" }]} phoneFacts={false} />);
  expect(container.querySelectorAll("dl")).toHaveLength(1);
  expect(container.querySelector("details")).toBeNull();
});

const play = { platform: "Android", href: "https://play.google.com/store/apps/details?id=x" } as const;
const apple = { platform: "iOS", href: "https://apps.apple.com/app/id1" } as const;
const web = { platform: "Web", href: "https://play.example.com" } as const;

it("shows the official store badges as links that open in a new tab", () => {
  render(<StoreCard primary={null} stores={[play, apple]} facts={[]} />);
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

it("shows the web link as a button, skipping it when the main button already goes there", () => {
  const { unmount } = render(<StoreCard primary={null} stores={[web]} facts={[]} />);
  expect(screen.getByRole("link", { name: "Play in your browser" })).toHaveAttribute("href", web.href);
  expect(screen.queryByRole("list", { name: "App stores" })).toBeNull();
  unmount();

  render(<StoreCard primary={{ label: "Play now", href: web.href }} stores={[web]} facts={[]} />);
  expect(screen.queryByRole("link", { name: "Play in your browser" })).toBeNull();
  expect(screen.getAllByRole("link")).toHaveLength(1);
});
