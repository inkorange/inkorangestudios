import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { GameLayout } from "./GameLayout";

const slots = (container: HTMLElement) => [...container.querySelectorAll("[data-slot]")].map((el) => el.getAttribute("data-slot"));

it("orders the slots for desktop in the DOM: title, media, store, main column, cards, beta band, then the full-width band", () => {
  const { container } = render(
    <GameLayout
      title={<h1>Title</h1>}
      media={<p>Media</p>}
      store={<p>Store</p>}
      about={<p>About</p>}
      features={<p>Features</p>}
      details={<p>Details</p>}
      updates={<p>Updates</p>}
      cards={<p>Cards</p>}
      beta={<p>Beta</p>}
      more={<p>More</p>}
    />,
  );
  expect(slots(container)).toEqual(["title", "media", "store", "main", "about", "features", "details", "updates", "cards", "beta", "more"]);
  // The beta band stays inside the content column, under both columns.
  expect(container.querySelector('[data-slot="beta"]')!.parentElement).toBe(container.querySelector("[data-frame]"));
  // The band sits outside the content frame so it can run full width.
  expect(container.querySelector('[data-slot="more"]')!.parentElement).toBe(container.firstElementChild);
  expect(container.querySelector('[data-frame]')).toHaveAttribute("data-store", "true");
});

it("renders only the slots it is given", () => {
  const { container } = render(<GameLayout title={<h1>Title</h1>} cards={<p>Cards</p>} />);
  expect(slots(container)).toEqual(["title", "cards"]);
  expect(container.querySelector('[data-frame]')).toHaveAttribute("data-store", "false");
  expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
});
