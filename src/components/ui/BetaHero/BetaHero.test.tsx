import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { BetaHero } from "./BetaHero";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

const art = { src: "https://cdn.sanity.io/k.png", alt: "Key art", width: 1600, height: 900 };

it("renders the notice, eyebrow, h1, lead, reward, action, note and art", () => {
  const { container } = render(
    <BetaHero
      notice="Android only for now."
      noticeIcon="android"
      eyebrow="From the makers of TerraForge"
      title="Play it first."
      lead="A puzzle game."
      perk="Testers get it free."
      action={<button type="button">Join</button>}
      note="We'll email you."
      art={art}
      artLabel="Key art"
    />,
  );
  expect(screen.getByText("Android only for now.")).toBeInTheDocument();
  expect(screen.getByText("From the makers of TerraForge")).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1, name: "Play it first." })).toBeInTheDocument();
  expect(screen.getByText("A puzzle game.")).toBeInTheDocument();
  expect(screen.getByText("Testers get it free.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Join" })).toBeInTheDocument();
  expect(screen.getByText("We'll email you.")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Key art" })).toHaveAttribute("src", art.src);
  // The icons are decorative.
  expect(container.querySelectorAll('[aria-hidden="true"] svg')).toHaveLength(2);
});

it("hides what is empty and shows the placeholder without art", () => {
  const { container } = render(<BetaHero title="Play it first." art={null} artLabel="Space Cowboy key art" />);
  expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.getByText("Space Cowboy key art")).toBeInTheDocument();
  expect(container.querySelectorAll("p")).toHaveLength(0);
});
