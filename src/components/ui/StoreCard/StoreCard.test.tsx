import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
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
