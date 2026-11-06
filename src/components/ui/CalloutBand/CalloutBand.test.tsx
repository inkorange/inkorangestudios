import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { CalloutBand } from "./CalloutBand";

it("renders eyebrow, title, body and the action slot", () => {
  render(<CalloutBand eyebrow="Now recruiting" title="Play first" body="Join the beta." action={<a href="/beta">Join</a>} />);
  expect(screen.getByText("Now recruiting")).toBeVisible();
  expect(screen.getByRole("heading", { level: 2, name: "Play first" })).toBeVisible();
  expect(screen.getByText("Join the beta.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Join" })).toBeVisible();
});
it("sets the eyebrow to the on-accent tone", () => {
  render(<CalloutBand eyebrow="Now recruiting" title="t" body="b" action={null} />);
  expect(screen.getByText("Now recruiting")).toHaveAttribute("data-tone", "on-accent");
});

it("flags the watercolor edge", () => {
  const { container } = render(<CalloutBand eyebrow="e" title="t" body="b" action={null} paint />);
  expect(container.firstElementChild).toHaveAttribute("data-paint", "true");
});
